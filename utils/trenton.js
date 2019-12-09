/*
* Trenton: A small commandline parser
*/


const alphas = 'abcdefghijklmnopqrstuvwxyz'
const digits = '0123456789'

const isAlpha = (str) => { return alphas.includes(str.toLowerCase()) }
const isDigit = (str) => { return digits.includes(str.toLowerCase()) }
const isAtEnd = (idx, lim) => { return idx >= lim }

const scan = (str) => {
    let tokens = []
    let index = 0

    while (index < str.length) {
        // Skip blank lines
        if (str[index] == ' ') {
            index += 1

            continue
        } else {
            // We expect arguments to be words or numbers
            // E.g. '128', 'input.txt', etc
            if (isAlpha(str[index]) || isDigit(str[index])) {
                // We have hit an argument
                let arg = ''

                // We build the argument letter by letter
                // and digit by digit
                while (!isAtEnd(index, str.length)) {
                    if (isAlpha(str[index]) ||
                        isDigit(str[index]) || str[index] == '.') {
                        arg += str[index]

                        // Advacne index
                        index += 1
                    } else { break }
                }

                tokens.push(arg)
            }

            if (str[index] == '-') {
                // Advance
                index += 1

                // We have hit an argument
                let term = ''

                // In case double dashes where used
                // Perform length check first, to avoid index errors
                if (!isAtEnd(index, str.length)) {
                    if (str[index] == '-') {
                        // if another dash found, we simply advance
                        index += 1
                    }
                }

                while (!isAtEnd(str[index])) {
                    if (isAlpha(str[index])) {
                        term += str[index]

                        // advance the token
                        index += 1
                    } else {
                        break
                    }
                }

                tokens.push(term)
            }
        }

        index += 1
    }

    return tokens
}

const parse = (tokens) => {
    // We assume that the tokens are of even length
    // ... an equal bijection can be made
    // ... in order to create a dict of metadata
    let meta = {}

    for (var i = 0;i < tokens.length/2;i++) {
        meta[tokens[i*2]] = tokens[i*2 + 1]
    }

    return meta
}

module.exports = { scan, parse }
