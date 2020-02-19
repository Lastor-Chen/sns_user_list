// Users API config
const userRequest = axios.create({
  baseURL: 'https://lighthouse-user-api.herokuapp.com/'
})
const USER_INDEX_URL = 'api/v1/users/'

// Photos API config
const PHOTO_WIDTH = 350
const PHOTO_HEIGHT = 100

/**
 * @param  { Number } width
 * @param  { Number } height
 * @param  { Number } num
 * @return { String }
 * @public
 */
function getRandomPhoto(num) {
  return `https://picsum.photos/${PHOTO_WIDTH}/${PHOTO_HEIGHT}?random=${num}`
}

export { userRequest, USER_INDEX_URL, getRandomPhoto }