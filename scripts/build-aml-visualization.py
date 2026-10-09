"""Build a bounded, traceable visualization; never copy the full input into web/."""
import argparse
import csv
import hashlib
import heapq
import json
from collections import Counter, defaultdict
from pathlib import Path

HEADER = ['Timestamp', 'From Bank', 'Account', 'To Bank', 'Account', 'Amount Received',
          'Receiving Currency', 'Amount Paid', 'Payment Currency', 'Payment Format', 'Is Laundering']
FANOUT = 8


def rows(path):
    with path.open(encoding='utf-8-sig', newline='') as handle:
        reader = csv.reader(handle)
        assert next(reader) == HEADER, 'Unexpected source schema'
        for number, row in enumerate(reader, 1):
            assert len(row) == 11, f'Malformed data row {number}'
            yield number, row


def sender(row):
    return row[1], row[2]


def recipient(row):
    return row[3], row[4]


def retain_latest(heap, item, limit=FANOUT):
    heapq.heappush(heap, item)
    if len(heap) > limit:
        heapq.heappop(heap)


def build(path, output):
    daily = defaultdict(lambda: [0, 0])
    accounts, currencies, formats = set(), Counter(), Counter()
    positive = self_transactions = total = 0
    candidates = []
    for number, row in rows(path):
        label = int(row[10])
        assert label in (0, 1)
        total += 1
        positive += label
        day = row[0][:10].replace('/', '-')
        daily[day][0] += 1
        daily[day][1] += label
        accounts.update((sender(row), recipient(row)))
        self_transactions += sender(row) == recipient(row)
        currencies[row[6]] += 1
        formats[row[9]] += 1
        if day == '2022-09-09' and label and sender(row) != recipient(row):
            candidates.append((row[0], number, row))
    candidates = sorted(candidates)[:128]
    assert candidates, 'No eligible focal transaction'
    summary = dict(transactions=total, positiveTransactions=positive, accounts=len(accounts), selfTransactions=self_transactions)
    print('Full-file totals:', summary, flush=True)
    del accounts
    interests = defaultdict(list)
    incoming = [defaultdict(list) for _ in candidates]
    for i, (timestamp, _, row) in enumerate(candidates):
        for account in (sender(row), recipient(row)):
            interests[account].append((i, timestamp))
    for number, row in rows(path):
        if sender(row) == recipient(row):
            continue
        for i, cutoff in interests.get(recipient(row), []):
            if row[0] <= cutoff and number != candidates[i][1]:
                retain_latest(incoming[i][recipient(row)], (row[0], number, row))
    first_by_candidate = [{item[1]: item[2] for bucket in incoming[i].values() for item in bucket}
                          for i in range(len(candidates))]
    second_interest = defaultdict(list)
    second_by_candidate = [defaultdict(list) for _ in candidates]
    future_by_candidate = [[] for _ in candidates]
    for i, (cutoff, _, focal) in enumerate(candidates):
        roots = {sender(focal), recipient(focal)}
        for account in {sender(row) for row in first_by_candidate[i].values()} - roots:
            second_interest[account].append((i, cutoff))
    for number, row in rows(path):
        if sender(row) == recipient(row):
            continue
        for i, cutoff in second_interest.get(recipient(row), []):
            if row[0] <= cutoff and number != candidates[i][1]:
                retain_latest(second_by_candidate[i][recipient(row)], (row[0], number, row))
        for i, cutoff in interests.get(recipient(row), []):
            if row[0] > cutoff:
                bucket = future_by_candidate[i]
                bucket.append((row[0], number, row))
                if len(bucket) > 40:
                    bucket[:] = sorted(bucket)[:12]
    def coverage(i):
        return len({sender(r) for r in first_by_candidate[i].values()} |
                   {sender(x[2]) for bucket in second_by_candidate[i].values() for x in bucket})
    # Prefer an interpretable example; this is explicitly not a representative sample.
    index = max(range(len(candidates)), key=lambda i: (coverage(i), -i))
    cutoff, focal_number, focal = candidates[index]
    roots = (sender(focal), recipient(focal))
    first = first_by_candidate[index]
    second = second_by_candidate[index]
    future = sorted(future_by_candidate[index])[:12]
    selected = {number: (row, 1, 'history') for number, row in first.items()}
    for bucket in second.values():
        for _, number, row in bucket:
            selected.setdefault(number, (row, 2, 'history'))
    selected[focal_number] = (focal, 0, 'target')
    for _, number, row in future:
        selected[number] = (row, 3, 'future')
    node_keys = list(roots)
    node_keys += sorted({key for row, _, _ in selected.values() for key in (sender(row), recipient(row))} - set(roots))
    node_ids = {key: i for i, key in enumerate(node_keys)}
    hops = {key: 0 for key in roots}
    for row, hop, _ in selected.values():
        hops[sender(row)] = min(hops.get(sender(row), 3), hop)
    nodes = [dict(id=f'A{i+1:03}', hop=hops.get(key, 3), role='sender' if i == 0 else 'recipient' if i == 1 else 'neighbor')
             for i, key in enumerate(node_keys)]
    edges = [dict(id=f'T{number}', row=number, source=node_ids[sender(row)], target=node_ids[recipient(row)],
                  timestamp=row[0].replace('/', '-'), amountReceived=row[5], currency=row[6], paymentFormat=row[9],
                  label=int(row[10]), hop=hop, phase=phase)
             for number, (row, hop, phase) in sorted(selected.items(), key=lambda x: (x[1][0][0], x[0]))]
    for edge in edges:
        assert edge['source'] != edge['target']
        assert 0 <= edge['source'] < len(nodes) and 0 <= edge['target'] < len(nodes)
        if edge['phase'] == 'history':
            assert edge['timestamp'] <= cutoff.replace('/', '-')
        if edge['phase'] == 'future':
            assert edge['timestamp'] > cutoff.replace('/', '-')
    assert len({e['row'] for e in edges}) == len(edges)
    assert sum(v[0] for v in daily.values()) == total
    assert sum(v[1] for v in daily.values()) == positive
    # Independent reread protects row provenance and duplicate Account column handling.
    verified = 0
    for number, row in rows(path):
        if number in selected:
            assert selected[number][0] == row
            verified += 1
    assert verified == len(edges)
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(8 * 1024 * 1024), b''):
            digest.update(chunk)
    data = {
        'source': {'file': path.name, 'bytes': path.stat().st_size, 'sha256': digest.hexdigest(),
                   'provider': 'IBM AMLworld / Altman et al. (2023)', 'url': 'https://github.com/IBM/AML-Data',
                   'license': 'CDLA-Sharing-1.0', 'synthetic': True},
        'summary': summary,
        'daily': [dict(date=day, transactions=v[0], positiveTransactions=v[1]) for day, v in sorted(daily.items())],
        'currencies': dict(currencies), 'paymentFormats': dict(formats),
        'selection': {'targetEdgeId': f'T{focal_number}', 'cutoff': cutoff.replace('/', '-'), 'hops': 2, 'fanout': FANOUT,
                      'candidateCount': len(candidates), 'nodes': len(nodes), 'transactions': len(edges),
                      'method': '9월 9일 양성 비자기거래 중 시각·원본 행 번호 순 앞 128건에서 아래 규칙의 과거 2층 부분망에 서로 다른 계좌가 가장 많은 한 건. 각 대상 계좌로 들어오는 시각 이하의 최근 비자기거래를 8건씩, 2층까지 추출. 대상 두 계좌의 이후 거래는 시각순 최대 12건을 별도 보관.',
                      'bias': '관계 설명을 위해 선택한 부분망이며 전체 데이터의 대표 표본이 아니다. 모델 학습 이웃 표본 또는 모델 예측 결과가 아니다.',
                      'modifications': '부분 추출, 은행+계좌를 별칭으로 치환, 원본 데이터 행 번호·hop·phase 추가. 금액·통화·시각·라벨은 원본 값.'},
        'nodes': nodes, 'edges': edges
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print('Selected subset:', len(nodes), 'accounts,', len(edges), 'transactions; focal', focal_number, cutoff, flush=True)
    print('SHA256:', digest.hexdigest(), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('input', type=Path)
    parser.add_argument('--output', type=Path, default=Path('web/data/transactions.json'))
    args = parser.parse_args()
    build(args.input, args.output)
