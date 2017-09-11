const fs = require('fs')

function readdirPromise(dirpath) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirpath, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

function writefilePromise(dirpath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(`${dirpath}/index.js`, content, err => {
      if (err) {
        reject(err)
      } else {
        resolve(true)
      }
    })
  })
}

function parseFileNames(dirpath) {
  return readdirPromise(dirpath)
    .then(results => {
      if (results) {
        const filteredResults = results.filter(e => !e.startsWith('_'))
        return filteredResults
      }
    })
}

function createFileString(arrayOfFiles) {
  const parsedInformation = arrayOfFiles.reduce((accumulator, fileName) => {
    const filenameWithoutExtension = fileName.match(/(.*)(?:\.)/)[1]
    if (fileName === 'index.js') {
      return accumulator
    }
    return [
      accumulator[0].concat(
        `import ${filenameWithoutExtension} from '${process.argv[2]}${filenameWithoutExtension}'\n`
      ), [...accumulator[1], filenameWithoutExtension]
    ]
  }, ['', []])

  let string = parsedInformation[0]

  string = string
    .concat('\nexport default {')
    .concat(parsedInformation[1].reduce((str, nameWithoutExtension) => {
      return str.concat(`\n  ${nameWithoutExtension},`)
    }, ''))
    .concat('\n}\n')

  return Promise.resolve(string)
}

if (!process.argv[2] ||
  process.argv[2].length <= 0 ||
  !process.argv[3] ||
  process.argv[3].length <= 0) {
  console.log(`Error - follow this format:
    node autoloadscript.js {path} {'log' || 'write'}`)
}

parseFileNames(process.argv[2])
  .then(arrayOfFiles => {
    return createFileString(arrayOfFiles)
  })
  .then(fileString => {
    if (process.argv[3] === 'log') {
      console.log(fileString)
    } else if (process.argv[3] === 'write') {
      return writefilePromise(process.argv[2], fileString)
    }
  })
  .then(written => {
    // This ternary is to make falsy value of "undefined" spit
    // out as literally "false" when it doesn't write a file
    console.log('written --> ', written ? true : false) // eslint-disable-line no-unneeded-ternary
  })
