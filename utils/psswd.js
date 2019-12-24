const fs = require('fs')


const SIGINT = 1

const printPrompt = (prompt, str, insert, hidden=true) => {
    process.stdout.write('\u001b[s')

    if (insert == str.length) {
        process.stdout.write(`\u001b[2K\u001b[0G${prompt + (hidden ? '' : str)}`)
    } else {
        process.stdout.write(`\u001b[2K\u001b[0G${prompt + (hidden ? '' : str)}`)
    }

    // Reset cursor pos to the right
    process.stdout.write(`\u001b[${prompt.length + 1 + (hidden ? '' : insert)}G`)
}

// Synchronous fn
const ReadInput = (prompt, hidden=true) => {
    let fd
    let insert = 0 // For arrows, to control cursor pos

    if (process.platform == 'win32') {
        fd = process.stdin.fd
    } else { fd = fs.openSync('/dev/tty', 'rs') }

    // check if raw mode on
    if (!process.stdin.isRaw) {
        process.stdin.setRawMode && process.stdin.setRawMode(true)
    }

    // create words buff
    let buff = new Buffer.alloc(3)
    let str = ''

    if (prompt) process.stdout.write(prompt)

    while (true) {
        readline = fs.readSync(fd, buff, 0, 3)

        if (readline > 1) {
            switch(buff.toString()) {
                case '\u001b[A': // Up Arrow
                    insert = str.length
                    break
                case '\u001b[B': // Down Arrow
                    insert = str.length
                    break
                case '\u001b[D': // Left Arrow (Back)
                    insert = str.length
                    break
                case '\u001b[C': // Rigth Arrow (Forward)
                    insert = str.length
                    break
                default:
                    if (buff.toString()) {
                        str = str + buff.toString()
                        str = str.replace(/\0/g, '')

                        insert = str.length

                        printPrompt(prompt, str, insert, hidden)

                        process.stdout.write(`\u001b[${insert+prompt.length+1}G`)

                        buff = new Buffer.alloc(3)
                    }
                }

                continue
            }

            let chr = buff[readline - 1]

            if (chr == 3) {
                process.stdout.write('^C\n')

                fs.closeSync(fd)

                if (SIGINT) process.exit(130)

                return null
            }

            if (chr == 13) {
                fs.closeSync(fd)
                break
            }

            // Backspace code
            if (chr == 127 || (process.platform == 'win32' && chr == 8)) {
                if (!insert) continue

                // Insert cursor pos, exactly after string
                insert = str.length

                // Then reduce text by one
                str = str.slice(0, insert-1)
                // Reset insert position
                insert -= 1

                process.stdout.write('\u001b[2D')
                // Done edit
            } else {
                if ((chr < 32) || (chr > 126)) continue

                str = str.slice(0, insert) + String.fromCharCode(chr) + str.slice(insert)
                insert++
            }

            printPrompt(prompt, str, insert, hidden)
        }

    process.stdout.write('\n')

    process.stdin.setRawMode && process.stdin.setRawMode(process.stdin.isRaw)

    return str || ''
}

module.exports = { ReadInput }
