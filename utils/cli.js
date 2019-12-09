const { scan, parse } = require('./trenton')

console.log('-------------')
console.log('Darlene CLI')
console.log('-------------\n')

const help = () => {
    console.log('Available options:\n')
    console.log('-h  --help\t\tPrint this message.\n\t\t\tNote: should be used without other options.\n\n')
    console.log('-f  --file\t\tSpecify file to read from.\n\t\t\tNote: Option required.\n')
    console.log("-o  --out\t\tSpecify where to write darlene file.\n\t\t\tDefaults to writing output file in the current directory.\n")
    console.log("-m  --mode\t\tSpecify the specific CBC mode, value is either 'gcm' or 'cbc'.\n\t\t\tDefaults to 'gcm' if this flag not specified.\n")
    console.log("-k  --keylength\t\tSpecify the key length, values are '128', '196', '256'.\n\t\t\tDefaults to '128' if this flag not specified.\n")
    console.log("-s  --show\t\tSpecify whether to show contents of file written, value either 'true' or 'false'.\n\t\t\tDefaults to false.")

    console.log("\nExamples:")
    console.log("\n\tdarlene -f plain.txt")
    console.log("\tdarlene -f plain.txt -o . -algo cbc")
    console.log("\tdarlene -f crypted.drln -o ~/Documents/ --algo cbc --keylength 128")
    console.log("\tdarlene -f plain.txt -k 256 --show true\n")
}

/* Inspect file ext to determine whether we are decrypting or encrypting */
/* Get args and pass it to trenton and get the metas */
/* Read contents of file */
/* Call the proper encrypt/decrypt */
