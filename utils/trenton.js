/*
* Trenton: A small hacky commandline wrangler
*/

const path = require('path')


// Easily translate some options to metas key
const meta_aliases = {
    'J': 'isJSON',
    'm': 'mode',
    'k': 'keylength',
    'e': 'encoding',
    'c': 'content',
    'f': 'file',
    'o': 'out',
    's': 'show'
}

// To manage valid option arguments
valid_required_values = {
    'keylength': ['128', '196', '256'],
    'encoding': ['hex', 'base64'],
    'mode': ['cbc', 'gcm']
}

// All valid options and flags
const valid_args = [ '-h',
                    '--help',
                    '-c', 
                    '--content',
                    '-f',
                    '--file',
                    '-o',
                    '--out',
                    '-m',
                    '--mode',
                    '-k',
                    '--keylength',
                    '-e',
                    '--encoding',
                    '-B',
                    '--binary',
                    '-J',
                    '--json',
                    '-S',
                    '--show' ]

// Our single character flags and their expanded versions
const flags = ['B', 'binary', 'J', 'json', 'S', 'show']

const joinArray = (arr) => {
    // Function returns a stringified array in the form '<elm>, <elm>, ... or <elm>'
    if (arr.length > 1) {
        let str = arr.slice(0, arr.length-1).join(', ')

        if (arr.length > 2) {
            str += ' or ' + arr[arr.length - 1]
        }

        return str
    } else {
        return arr.toString()
    }
}

const getValue = (args, idx) => {
    // Returns the value of an argument if available
    // ... else it throws an error
    let raw_arg = stripArg(args[idx])
    let arg = raw_arg.replace((new RegExp('-', 'g')), '') // Get stripped arg

    // If its a flag that doesn't require an argument then we simply return arg
    if (flags.includes(arg)) {
        let idx = flags.indexOf(arg)

        // expand single flag name
        // E.g. 'B' -> 'binary'
        idx = (idx + 1 == flags.length) || (idx - 1 % 2 == 0) ? idx : idx + 1

        // Remember including a flag sets the value to true
        return {arg: flags[idx], value: true, inc: 0, ret_val: 0, invalid: false, valids: []}
    }

    // expand single flag names
    // E.g. 'f' -> 'file'
    if (Object.keys(meta_aliases).includes(arg)) {
        arg = arg.length == 1 ? meta_aliases[arg] : arg
    }

    // Check if the option carries an arg
    let nidx = idx+1

    if (nidx >= args.length) {
        return {arg: raw_arg, value: `'<${arg}>'`, inc: null, ret_val: 1, invalid: false, valids: []}
    }

     // Check if arguments 'keylength', 'encoding', and 'mode' are valid
     if (Object.keys(valid_required_values).includes(arg)) {
        if (!valid_required_values[arg].includes(args[nidx])) {
            return {arg: raw_arg, value: `'<${arg}>'`, inc: null, ret_val: 1, invalid: true, valids: valid_required_values[arg]}
        }
    }

    return {arg: arg, value: args[nidx], inc: 1, ret_val: 0, invalid: false, valids: []}
}

const stripArg = (str) => {
    let arg = str

    // Watch out for potential use of flags with '='
    // E.g. --content="Hello" or -c="Hello"
    if (arg.match(/^-(-)?.+=/)) {
        // extract the command
        arg = arg.replace(/=.+/, '')
    }

    return arg
}

const stripValue = (str) => {
    let val = str

    if (str.match(/^-(-)?.+=/)) {
        // Fetch value after '='
        val = str.replace(/^-(-)?.+=/, '')
    }

    return val
}

const sanitizeArgs = (args) => {
    let newArgs = []

    for (var i = 0;i < args.length;i++) {
        // Do we have '--<cmd>=val'
        if (args[i].match(/^-(-)?.+=/)) {
            // If so, we have to extract the arg from the value
            newArgs.push(stripArg(args[i]))
            newArgs.push(stripValue(args[i]))
        } else {
            // If not, most likely separated by newlines
            // ... so we just return it the way it is
            newArgs.push(args[i])
        }
    }

    return newArgs
}

const buildMeta = (args) => {
    // Default values for metas
    let metas = {
        mode: 'gcm',
        keylength: 256,
        encoding: 'hex',
        isJSON: false,
        ext: null,
        file: null,
        out: '.',
        content: null,
        show: false
    }

    let i = 0

    // Main work done here
    // Traversing the args and updating the metas accordingly
    while (i < args.length) {
        if (valid_args.includes(args[i])) {
            let obj = getValue(args, i)

            if (obj.ret_val == 0) {
                // Special case for 'binary' flag
                // Since it determins the file content type
                // ... we have to set the 'ext' to true and then fill later
                // ... this way, Darlene can handle the file contents properly when encrypting/decryprting
                if (obj.arg == 'B' || obj.arg == 'binary') {
                    metas['ext'] = true
                } else {
                    // Other metas are updating by direct indexing
                    // ... since the 'arg' is expanded and matches the keys
                    metas[obj.arg] = obj.value
                }
    
                // Instead of a single increment
                // We increment beyond the argument's value
                i += (1 + obj.inc)
            } else {
                // Prints whether no value was provided for a flag or 
                // whether an invalid value was provided with a certain flag
                throw `darlene: flag '${stripArg(obj.arg)}' requires ${obj.invalid ? 'value of either' : 'an argument'} ${obj.invalid ? joinArray(obj.valids) : ''}`
            }
        } else {
            // Alerts user that the option does not exist
            throw `darlene: invalid option '${stripArg(args[i])}'`
        }
    }

    // Check if dependent args provided
    // can't provide 'ext' or isJSON flag if no '-f' file in
    
    // Set ext value
    if (metas.ext) {
        // Remember that the 'binary' option set this to true
        // ... now we fill it in with the actual ext value
        metas.ext = metas.file.slice(metas.file.lastIndexOf('.')+1)
    }
  
    return metas

}

module.exports = { buildMeta, sanitizeArgs }
