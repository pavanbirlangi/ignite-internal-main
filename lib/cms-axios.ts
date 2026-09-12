import axios from 'axios'

const cmsClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_CMS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default cmsClient
