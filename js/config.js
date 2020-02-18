// 第三方 API config

const userRequest = axios.create({
  baseURL: 'https://lighthouse-user-api.herokuapp.com/'
})
const USER_INDEX_URL = 'api/v1/users/'

const photoRequest = 'https://picsum.photos/'
const photo_INDEX_URL = '350/100?random='

export { userRequest, USER_INDEX_URL, photoRequest, photo_INDEX_URL }