export const reviewCount = 864;
export const models = {
  xgboost: {name:'XGBoost', ap:17.8298, detected:288, description:'같은 거래 특징을 사용하는 트리 기반 머신러닝 기준선.'},
  mlp: {name:'Edge-MLP', ap:17.6210, detected:287, description:'거래 한 건의 특징을 학습하는 비그래프 신경망 기준선.'},
  gin: {name:'GIN', ap:40.7132, detected:529, description:'주변 거래 관계를 합계 중심으로 모으는 그래프 모델.'},
  pna: {name:'PNA', ap:55.5908, detected:701, description:'평균·최대·최소·표준편차와 연결 수를 함께 사용하는 그래프 모델.'}
};
export function resultFor(key) {
  const model = models[key];
  if (!model) throw new RangeError('Unknown model');
  return {...model, normal:reviewCount-model.detected, precision:100*model.detected/reviewCount};
}
