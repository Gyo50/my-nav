export const DESTINATIONS = [
  { id: 1, name: '서울 CS센터',   address: '서울 영등포구 경인로71길 70',           lat: 37.5150641632063,  lng: 126.88607722083,   category: 'CS센터', emoji: '🏢' },
  { id: 2, name: '의정부 CS센터', address: '경기 의정부시 의정로 102',               lat: 37.7418220132475,  lng: 127.034998612683,  category: 'CS센터', emoji: '🏢' },
  { id: 3, name: '부천 CS센터',   address: '경기 부천시 원미구 상일로 14-9',         lat: 37.4912547532554,  lng: 126.743579053552,  category: 'CS센터', emoji: '🏢' },
  { id: 4, name: '대전 CS센터',   address: '대전 대덕구 계족로 539',                 lat: 36.3600543896788,  lng: 127.431677921237,  category: 'CS센터', emoji: '🏢' },
  { id: 5, name: '수원 CS센터',   address: '경기 수원시 권선구 입북로43번길 8',      lat: 37.2954835194654,  lng: 126.958666254614,  category: 'CS센터', emoji: '🏢' },
  { id: 6, name: '대구 CS센터',   address: '대구 동구 동촌로24길 30',                lat: 35.8848200801379,  lng: 128.653298378113,  category: 'CS센터', emoji: '🏢' },
  { id: 7, name: '부산 CS센터',   address: '부산 동구 중앙대로 502',                 lat: 35.1381046274775,  lng: 129.056866656726,  category: 'CS센터', emoji: '🏢' },
  { id: 8, name: '광주 CS센터',   address: '광주 북구 하남대로 475',                 lat: 35.1759822330209,  lng: 126.845342960459,  category: 'CS센터', emoji: '🏢' },
  { id: 9, name: '원주 CS센터',   address: '강원특별자치도 원주시 행가리1길 6',      lat: 37.32348721369851, lng: 127.91826871478203, category: 'CS센터', emoji: '🏢' },
]

export const CATEGORIES = ['전체', ...new Set(DESTINATIONS.map(d => d.category))]