const { EncodingError } = require('./errors')


const AbbvEnconding = (str) => {
    if (str.slice(0, 4) == 'base') {
        // so that 'base64' shortens to 'b64',
        // ... 'base58' to 'b58', etc
        return 'b' + str.slice(4)
    } else {
        return str
    }
}

const ExpandEncoding = (str) => {
    if (str[0] == 'b' && str.length == 3) {
        // so that 'base64' shortens to 'b64',
        // ... 'base58' to 'b58', etc
        return 'base' + str.slice(1)
    } else {
        return str
    }
}

const MakeBuffer = (hash, encoding) => {
    // JS does not know what 'b64 is, so we expand it to 'base64'
    encoding = encoding == 'b64' ? ExpandEncoding(encoding) : encoding

    if (!['base64', 'hex'].includes(encoding)) {
        throw new EncodingError("encoding must be either 'hex' or 'base64'")
    }

    return Buffer.from(hash, encoding)
}


module.exports = { AbbvEnconding, ExpandEncoding, MakeBuffer }
