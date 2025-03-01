"use strict"

const baseX = require('base-x');
const secp256k1 = require('secp256k1');
const aesJs = require('aes-js');
const myCrypto = require('node:crypto');

const getBasex = lazyLoad(function() {
  return baseX;
  //return require("base-x")
})

const getSecp256k1 = lazyLoad(function() {
  return secp256k1;
  //return require("secp256k1")
})

const getAES = lazyLoad(function() {
  return aesJs;
  //return require("aes-js")
})

const hashBuffer = function(algo) {
  return function(value) {
    return myCrypto
      .createHash(algo)
      .update(value)
      .digest()
  }
}

exports.hashBufferNative = function hashBufferNative() { return hashBuffer.apply(this, arguments); };

exports.hashStringNative = function hashStringNative() { return hashBuffer.apply(this, arguments); };

const generatePrivateKey = function(bytes) {
  const privateKey = myCrypto.randomBytes(bytes)
  if (getSecp256k1().privateKeyVerify(privateKey)) {
    return privateKey
  }

  return generatePrivateKey(bytes)
}

exports.verifyPrivateKey = function verifyPrivateKey(privateKey) {
  return getSecp256k1().privateKeyVerify(privateKey)
}

exports.verifyPublicKey = function verifyPublicKey(publicKey) {
  return getSecp256k1().publicKeyVerify(publicKey)
}

exports.createPrivateKey = function createPrivateKey(bytes) {
  return function() {
    return generatePrivateKey(bytes)
  }
}

exports.deriveKeyNative = function deriveKeyNative(privateKey) {
  return getSecp256k1().publicKeyCreate(privateKey, false)
}

exports.privateKeyExport = function privateKeyExport(privateKey) {
  return getSecp256k1().privateKeyExport(privateKey)
}

exports.privateKeyImport = function privateKeyImport(success) {
  return function(failure) {
    return function(buffer) {
      try {
        const ret = getSecp256k1().privateKeyImport(buffer)
        return success(ret)
      } catch (e) {
        return failure
      }
    }
  }
}

exports.signFn = function(success) {
  return function(failure) {
    return function(privateKey) {
      return function(message) {
        try {
          const ret = getSecp256k1().sign(
            message,
            privateKey
          )
          return success(ret.signature)
        } catch (e) {
          return failure
        }
      }
    }
  }
}

exports.verifyFn = function (publicKey) {
  return function(signature) {
    return function(message) {
      try {
        return getSecp256k1().verify(
          message,
          signature,
          publicKey
        )
      } catch (e) {
        return false
      }
    }
  }
}

exports.signatureExport = function (signature) {
  return getSecp256k1().signatureExport(signature)
}

exports.signatureImport = function (success) {
  return function(failure) {
    return function(buffer) {
      try {
        const ret = getSecp256k1().signatureImport(buffer)
        return success(ret)
      } catch (e) {
        return failure
      }
    }
  }
}

exports.bufferToHex = function (buffer) {
  return buffer.toString("hex")
}

exports.encodeWith = function (success) {
  return function(failure) {
    return function(encoding) {
      return function(value) {
        try {
          const ret = getBasex()(encoding).encode(Buffer.from(value, "hex"))
          return success(ret)
        } catch (e) {
          return failure
        }
      }
    }
  }
}

exports.decodeWith = function(success) {
  return function(failure) {
    return function(encoding) {
      return function(value) {
        try {
          const ret = getBasex()(encoding)
            .decode(value)
            .toString("hex")
          return success(ret)
        } catch (e) {
          return failure
        }
      }
    }
  }
}

// dirty trick to lazy load dependencies
function lazyLoad(loadPkg) {
  var fn = function() {
    const loaded = loadPkg()
    fn = function() {
      return loaded
    }

    return fn()
  }

  return fn
}

exports.nativeAESEncrypt = function(privateKey) {
  return function(iv) {
    return function(payload) {
      return function() {
        var aesjs = getAES()
        var pk = aesjs.utils.hex.toBytes(privateKey.toString("hex"))
        var counter = new aesjs.Counter(iv)
        var instance = new aesjs.ModeOfOperation.ctr(pk, counter)
        return Buffer.from(instance.encrypt(payload))
      }
    }
  }
}

exports.nativeAESDecrypt = function(privateKey) {
  return function(iv) {
    return function(payload) {
      return function() {
        var aesjs = getAES()
        var pk = aesjs.utils.hex.toBytes(privateKey.toString("hex"))
        var counter = new aesjs.Counter(iv)
        var instance = new aesjs.ModeOfOperation.ctr(pk, counter)
        return Buffer.from(instance.decrypt(payload))
      }
    }
  }
}

exports.nativeGenerateRandomNumber = function() {
  return myCrypto.randomBytes(8).readUInt32BE()
}
