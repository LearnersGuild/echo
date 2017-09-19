import fs from 'fs'
import path from 'path'
import dbConfig from 'src/config/db'
import finish from './util'

const configOutputPath = path.resolve(__dirname, '../data/database.json')

fs.writeFile(configOutputPath, JSON.stringify(dbConfig), finish)
