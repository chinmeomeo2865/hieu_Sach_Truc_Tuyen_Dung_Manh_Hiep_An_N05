require('dotenv').config()
const app       = require('./src/app')
const connectDB = require('./src/config/db')

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    const { startAutoCancelJob } = require('./src/services/cronService')
    startAutoCancelJob()

    app.listen(PORT, () =>
      console.log(`✅  Server running on http://localhost:${PORT}  [${process.env.NODE_ENV}]`)
    )
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message)
    process.exit(1)
  })
