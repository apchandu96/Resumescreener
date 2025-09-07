// import mongoose from 'mongoose'
// import dotenv from 'dotenv'
// dotenv.config()
// await mongoose.connect(process.env.MONGO_URL)
// console.log('Seed ready: add your own inserts.')
// process.exit()



import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config() // load MONGO_URL from .env

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/resume_screener'

async function clearCollections() {
  try {
    await mongoose.connect(MONGO_URL)
    console.log('Connected to MongoDB:', MONGO_URL)

    const db = mongoose.connection.db

    // list of collections to clear
    const collections = ['users', 'candidates', 'jobroles', 'screeningresults']

    for (const coll of collections) {
      const collection = db.collection(coll)
      const result = await collection.deleteMany({})
      console.log(`Cleared ${result.deletedCount} documents from "${coll}"`)
    }

    console.log('✅ All specified collections cleared')
    process.exit(0)
  } catch (err) {
    console.error('Error clearing collections:', err)
    process.exit(1)
  }
}

clearCollections()
