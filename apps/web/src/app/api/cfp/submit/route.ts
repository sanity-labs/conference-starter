import {NextResponse} from 'next/server'
import {createClient} from 'next-sanity'
import {z} from 'zod'

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2026-03-15',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

const submissionSchema = z.object({
  sessionTitle: z.string().min(1, 'Session title is required').max(200),
  sessionType: z.enum(['talk', 'lightning', 'panel', 'workshop']),
  abstract: z.string().min(100, 'Abstract must be at least 100 characters').max(2000),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  topics: z.array(z.string().min(1)).min(1, 'Add at least one topic').max(5),
  submitterName: z.string().min(1, 'Name is required'),
  submitterEmail: z.string().email('Valid email required'),
  company: z.string().optional(),
  bio: z.string().min(50, 'Bio must be at least 50 characters').max(500),
  // Honeypot field — should be empty
  _gotcha: z.string().max(0).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Honeypot check
    if (body._gotcha) {
      // Silently succeed for bots
      return NextResponse.json({success: true})
    }

    const result = submissionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {success: false, errors: result.error.flatten().fieldErrors},
        {status: 400},
      )
    }

    const {_gotcha: _, ...data} = result.data

    // Check if CFP is open
    const conference = await writeClient.fetch(
      `*[_type == "conference"][0]{ _id, cfpOpen, cfpDeadline }`,
    )

    if (!conference) {
      return NextResponse.json({success: false, error: 'Conference not found'}, {status: 404})
    }

    const isOpen = conference.cfpOpen
    const isPastDeadline =
      conference.cfpDeadline && new Date(conference.cfpDeadline) < new Date()

    if (!isOpen || isPastDeadline) {
      return NextResponse.json(
        {success: false, error: 'The Call for Papers is currently closed'},
        {status: 400},
      )
    }

    // Create submission document
    await writeClient.create({
      _type: 'submission',
      sessionTitle: data.sessionTitle,
      sessionType: data.sessionType,
      abstract: data.abstract,
      level: data.level,
      topics: data.topics,
      submitterName: data.submitterName,
      submitterEmail: data.submitterEmail,
      company: data.company || undefined,
      bio: data.bio,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      conference: {
        _type: 'reference',
        _ref: conference._id,
      },
    })

    return NextResponse.json({success: true})
  } catch {
    return NextResponse.json(
      {success: false, error: 'Something went wrong. Please try again.'},
      {status: 500},
    )
  }
}
