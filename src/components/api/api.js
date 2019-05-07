import axios from 'axios'

export default async (q) => {
  try {
    return await axios({
      method: 'get',
      baseURL: process.env.REACT_APP_DEV_API_URL,
      url: 'jobs.json',
      // headers: { 'api-key': process.env.REACT_APP_DEV_API_KEY },
      params: {
        q
      }
    })
  } catch (error) {
    console.log(error)
    throw error
  }
}
