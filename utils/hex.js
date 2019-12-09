// Alphnumric aliases
const Alphs = {
    'a': 10,
    'b': 11,
    'c': 12,
    'd': 13,
    'e': 14,
    'f': 15
}

const Translate = (chr) => {
    let buff = new Buffer.alloc(1)

    buff.writeInt8(chr)
    
    return buff.toString('hex')
}

const HexToBuffer = (hex, size) => {
    // Assumes 'hex' is a string representation of a hex value

    // Creates a new buffer of size 'size'
    let buff = new Buffer.alloc(size, 0)
    buff.hexWrite(hex)

    return buff
}

module.exports = { HexToBuffer, Translate }
