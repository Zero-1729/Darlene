#!/usr/local/bin/node

const { scan, parse } = require('../utils/trenton')

console.log('-------------')
console.log('Darlene CLI')
console.log('-------------\n')

const help = () => {
    console.log('Available options:\n')
    console.log('-h  --help\t\t args: - \t\tPrint this message.\n\t\t\tNote: should be used without other options.\n\n')
    console.log('-r  --raw\t\t args: <string> \t\tSpecify raw text to encrypt\n')
    console.log('-f  --file\t\t args: <filepath> \t\tSpecify file to read from.\n\t\t\tNote: Option required.\n')
    console.log("-o  --out\t\t args: <filepath> \t\tSpecify where to write darlene file.\n\t\t\tDefaults to writing output file in the current directory.\n")
    console.log("-m  --mode\t\t args: <mode> \t\tSpecify the specific AES mode, value is either 'gcm' or 'cbc'.\n\t\t\tDefaults to 'gcm' if this flag not specified.\n")
    console.log("-k  --keylength\t\t args: <keylength> \t\tSpecify the key length, values are '128', '196', '256'.\n\t\t\tDefaults to '256' if this flag not specified.\n")
    console.log("-e  --encoding\t\t args: <encoding> \t\tSpecify the encoding fo hash(es), values are either 'hex' or 'base64'.\n\t\t\tDefaults to 'hex' if this flag not specified.\n")
    console.log("-J  --json\t\t args: - \t\tFlag to indicate content type of plain text.\n\t\t\tDefaults to false when left out.")
    console.log("-S  --show\t\t args: - \t\tFlag to show contents of file written.\n\t\t\tDefaults to false when left out.")

    console.log("\nExamples:")
    console.log("\n\tdarlene -r 'Hello world' -o . --show")
    console.log("\n\tdarlene -f plain.txt")
    console.log("\tdarlene -f plain.txt -o . --mode cbc")
    console.log("\tdarlene -f crypted.drln -o ~/Documents/ --mode cbc --keylength 128")
    console.log("\tdarlene -f plain.txt -k 256 --show\n")
}

/* Inspect file ext to determine whether we are decrypting or encrypting, if '-o' flag present then its encrypting */
/* Get args and pass it to trenton and get the metas */
/* Read contents of file */
/* Call the proper encrypt/decrypt */
/* Handle unknown command */
/* Report if value not standard or missing */

// Our synthetic main fn
(() => {
    const args = process.argv.slice(2)

    if (args.length == 0) {
        help()
    } else {
        console.log("Recieved: ", args)
    }
})()
