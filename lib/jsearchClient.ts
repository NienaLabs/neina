export type JobApiItem = {
  job_publisher:       string
  job_title :           string
  employer_name:        string
  employer_logo :       string
  job_apply_link:       string
  job_location:         string
  job_description:      string
  job_posted_at :       string | null            
  job_is_remote:        boolean
  qualifications :      string
  responsibilities:    string
  created_at:          Date            
  updated_at:          Date              
}

export type JobApiPage = {
  data: JobApiItem[]
  num_pages?: number
  page?: number
}

const JSEARCH_BASE = process.env.JSEARCH_BASE_URL
const JSEARCH_KEY = process.env.JSEARCH_API_KEY


export async function fetchJobs(
  query: string,
  location = '',
  page = 1,
): Promise<JobApiPage> {
const url = `${JSEARCH_BASE}/search?query=${encodeURIComponent(query)}&page=${page}${location ? `&location=${encodeURIComponent(location)}` : ''}`
     try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': String(JSEARCH_KEY),
        }
      })

      if (res.status === 429) {
        throw new Error('JSearch rate limited (429)')
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`JSearch error ${res.status}: ${text}`)
      }

      const json = await res.json()
      const data: JobApiItem[] = json?.data ?? []

      return { data, num_pages: json?.num_pages ?? json?.num_pages ?? undefined, page }
    } catch (err) {
     throw err
    }
  }

export default fetchJobs
