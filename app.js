const express = require('express')
const app = express()

require('dotenv').config({ path: './config/.env' })

// Setting rate limiting
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})

app.set('trust proxy', 1)

// pull in the required packages.
const {
  TextAnalyticsClient,
  AzureKeyCredential,
} = require('@azure/ai-text-analytics')

const endpoint = process.env['ENDPOINT'] || '<cognitive services endpoint>'
const apiKey = process.env['TEXT_ANALYTICS_API_KEY'] || '<api key>'

//Server Setup
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(limiter)

//Routes
app.get('/', (req, res) => {
  res.render('index.ejs')
})

app.post('/', async (req, res) => {
  try {
    const documents = [String(req.body.sendText)]

    console.log('=== Analyze Sentiment Sample ===')

    const client = new TextAnalyticsClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    )

    const results = await client.analyzeSentiment(documents)

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      console.log(`- Document ${result.id}`)
      if (!result.error) {
        console.log(`\tDocument text: ${documents[i]}`)
        console.log(`\tOverall Sentiment: ${result.sentiment}`)
        console.log('\tSentiment confidence scores: ', result.confidenceScores)
        console.log('\tSentences')
        for (const { sentiment, confidenceScores, text } of result.sentences) {
          console.log(`\t- Sentence text: ${text}`)
          console.log(`\t  Sentence sentiment: ${sentiment}`)
          console.log('\t  Confidence scores:', confidenceScores)
        }
      } else {
        console.error(`  Error: ${result.error}`)
      }
    }

    console.log(results)

    res.render('result.ejs', { result: results, text: documents })
  } catch (err) {
    console.log(err)
  }
})

app.listen(process.env.PORT || 8000)
