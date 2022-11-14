function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object.keys(descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;
  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }
  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);
  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }
  if (desc.initializer === void 0) {
    Object.defineProperty(target, property, desc);
    desc = null;
  }
  return desc;
}

var PromiseResult;
(function (PromiseResult) {
  PromiseResult[PromiseResult["NotReady"] = 0] = "NotReady";
  PromiseResult[PromiseResult["Successful"] = 1] = "Successful";
  PromiseResult[PromiseResult["Failed"] = 2] = "Failed";
})(PromiseResult || (PromiseResult = {}));
var PromiseError;
(function (PromiseError) {
  PromiseError[PromiseError["Failed"] = 0] = "Failed";
  PromiseError[PromiseError["NotReady"] = 1] = "NotReady";
})(PromiseError || (PromiseError = {}));

function u8ArrayToBytes(array) {
  let ret = "";
  for (let e of array) {
    ret += String.fromCharCode(e);
  }
  return ret;
}
// TODO this function is a bit broken and the type can't be string
// TODO for more info: https://github.com/near/near-sdk-js/issues/78
function bytesToU8Array(bytes) {
  let ret = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    ret[i] = bytes.charCodeAt(i);
  }
  return ret;
}
function assert(b, str) {
  if (b) {
    return;
  } else {
    throw Error("assertion failed: " + str);
  }
}

/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function assertNumber(n) {
  if (!Number.isSafeInteger(n)) throw new Error(`Wrong integer: ${n}`);
}
function chain(...args) {
  const wrap = (a, b) => c => a(b(c));
  const encode = Array.from(args).reverse().reduce((acc, i) => acc ? wrap(acc, i.encode) : i.encode, undefined);
  const decode = args.reduce((acc, i) => acc ? wrap(acc, i.decode) : i.decode, undefined);
  return {
    encode,
    decode
  };
}
function alphabet(alphabet) {
  return {
    encode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('alphabet.encode input should be an array of numbers');
      return digits.map(i => {
        assertNumber(i);
        if (i < 0 || i >= alphabet.length) throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet.length})`);
        return alphabet[i];
      });
    },
    decode: input => {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('alphabet.decode input should be array of strings');
      return input.map(letter => {
        if (typeof letter !== 'string') throw new Error(`alphabet.decode: not string element=${letter}`);
        const index = alphabet.indexOf(letter);
        if (index === -1) throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet}`);
        return index;
      });
    }
  };
}
function join(separator = '') {
  if (typeof separator !== 'string') throw new Error('join separator should be string');
  return {
    encode: from => {
      if (!Array.isArray(from) || from.length && typeof from[0] !== 'string') throw new Error('join.encode input should be array of strings');
      for (let i of from) if (typeof i !== 'string') throw new Error(`join.encode: non-string input=${i}`);
      return from.join(separator);
    },
    decode: to => {
      if (typeof to !== 'string') throw new Error('join.decode input should be string');
      return to.split(separator);
    }
  };
}
function padding(bits, chr = '=') {
  assertNumber(bits);
  if (typeof chr !== 'string') throw new Error('padding chr should be string');
  return {
    encode(data) {
      if (!Array.isArray(data) || data.length && typeof data[0] !== 'string') throw new Error('padding.encode input should be array of strings');
      for (let i of data) if (typeof i !== 'string') throw new Error(`padding.encode: non-string input=${i}`);
      while (data.length * bits % 8) data.push(chr);
      return data;
    },
    decode(input) {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('padding.encode input should be array of strings');
      for (let i of input) if (typeof i !== 'string') throw new Error(`padding.decode: non-string input=${i}`);
      let end = input.length;
      if (end * bits % 8) throw new Error('Invalid padding: string should have whole number of bytes');
      for (; end > 0 && input[end - 1] === chr; end--) {
        if (!((end - 1) * bits % 8)) throw new Error('Invalid padding: string has too much padding');
      }
      return input.slice(0, end);
    }
  };
}
function normalize(fn) {
  if (typeof fn !== 'function') throw new Error('normalize fn should be function');
  return {
    encode: from => from,
    decode: to => fn(to)
  };
}
function convertRadix(data, from, to) {
  if (from < 2) throw new Error(`convertRadix: wrong from=${from}, base cannot be less than 2`);
  if (to < 2) throw new Error(`convertRadix: wrong to=${to}, base cannot be less than 2`);
  if (!Array.isArray(data)) throw new Error('convertRadix: data should be array');
  if (!data.length) return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data);
  digits.forEach(d => {
    assertNumber(d);
    if (d < 0 || d >= from) throw new Error(`Wrong integer: ${d}`);
  });
  while (true) {
    let carry = 0;
    let done = true;
    for (let i = pos; i < digits.length; i++) {
      const digit = digits[i];
      const digitBase = from * carry + digit;
      if (!Number.isSafeInteger(digitBase) || from * carry / from !== carry || digitBase - digit !== from * carry) {
        throw new Error('convertRadix: carry overflow');
      }
      carry = digitBase % to;
      digits[i] = Math.floor(digitBase / to);
      if (!Number.isSafeInteger(digits[i]) || digits[i] * to + carry !== digitBase) throw new Error('convertRadix: carry overflow');
      if (!done) continue;else if (!digits[i]) pos = i;else done = false;
    }
    res.push(carry);
    if (done) break;
  }
  for (let i = 0; i < data.length - 1 && data[i] === 0; i++) res.push(0);
  return res.reverse();
}
const gcd = (a, b) => !b ? a : gcd(b, a % b);
const radix2carry = (from, to) => from + (to - gcd(from, to));
function convertRadix2(data, from, to, padding) {
  if (!Array.isArray(data)) throw new Error('convertRadix2: data should be array');
  if (from <= 0 || from > 32) throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32) throw new Error(`convertRadix2: wrong to=${to}`);
  if (radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const mask = 2 ** to - 1;
  const res = [];
  for (const n of data) {
    assertNumber(n);
    if (n >= 2 ** from) throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32) throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to) res.push((carry >> pos - to & mask) >>> 0);
    carry &= 2 ** pos - 1;
  }
  carry = carry << to - pos & mask;
  if (!padding && pos >= from) throw new Error('Excess padding');
  if (!padding && carry) throw new Error(`Non-zero padding: ${carry}`);
  if (padding && pos > 0) res.push(carry >>> 0);
  return res;
}
function radix(num) {
  assertNumber(num);
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix.encode input should be Uint8Array');
      return convertRadix(Array.from(bytes), 2 ** 8, num);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix.decode input should be array of strings');
      return Uint8Array.from(convertRadix(digits, num, 2 ** 8));
    }
  };
}
function radix2(bits, revPadding = false) {
  assertNumber(bits);
  if (bits <= 0 || bits > 32) throw new Error('radix2: bits should be in (0..32]');
  if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32) throw new Error('radix2: carry overflow');
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix2.encode input should be Uint8Array');
      return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix2.decode input should be array of strings');
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    }
  };
}
function unsafeWrapper(fn) {
  if (typeof fn !== 'function') throw new Error('unsafeWrapper fn should be function');
  return function (...args) {
    try {
      return fn.apply(null, args);
    } catch (e) {}
  };
}
const base16 = chain(radix2(4), alphabet('0123456789ABCDEF'), join(''));
const base32 = chain(radix2(5), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHIJKLMNOPQRSTUV'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ'), join(''), normalize(s => s.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1')));
const base64 = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'), padding(6), join(''));
const base64url = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'), padding(6), join(''));
const genBase58 = abc => chain(radix(58), alphabet(abc), join(''));
const base58 = genBase58('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
genBase58('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ');
genBase58('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz');
const XMR_BLOCK_LEN = [0, 2, 3, 5, 6, 7, 9, 10, 11];
const base58xmr = {
  encode(data) {
    let res = '';
    for (let i = 0; i < data.length; i += 8) {
      const block = data.subarray(i, i + 8);
      res += base58.encode(block).padStart(XMR_BLOCK_LEN[block.length], '1');
    }
    return res;
  },
  decode(str) {
    let res = [];
    for (let i = 0; i < str.length; i += 11) {
      const slice = str.slice(i, i + 11);
      const blockLen = XMR_BLOCK_LEN.indexOf(slice.length);
      const block = base58.decode(slice);
      for (let j = 0; j < block.length - blockLen; j++) {
        if (block[j] !== 0) throw new Error('base58xmr: wrong padding');
      }
      res = res.concat(Array.from(block.slice(block.length - blockLen)));
    }
    return Uint8Array.from(res);
  }
};
const BECH_ALPHABET = chain(alphabet('qpzry9x8gf2tvdw0s3jn54khce6mua7l'), join(''));
const POLYMOD_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
function bech32Polymod(pre) {
  const b = pre >> 25;
  let chk = (pre & 0x1ffffff) << 5;
  for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
    if ((b >> i & 1) === 1) chk ^= POLYMOD_GENERATORS[i];
  }
  return chk;
}
function bechChecksum(prefix, words, encodingConst = 1) {
  const len = prefix.length;
  let chk = 1;
  for (let i = 0; i < len; i++) {
    const c = prefix.charCodeAt(i);
    if (c < 33 || c > 126) throw new Error(`Invalid prefix (${prefix})`);
    chk = bech32Polymod(chk) ^ c >> 5;
  }
  chk = bech32Polymod(chk);
  for (let i = 0; i < len; i++) chk = bech32Polymod(chk) ^ prefix.charCodeAt(i) & 0x1f;
  for (let v of words) chk = bech32Polymod(chk) ^ v;
  for (let i = 0; i < 6; i++) chk = bech32Polymod(chk);
  chk ^= encodingConst;
  return BECH_ALPHABET.encode(convertRadix2([chk % 2 ** 30], 30, 5, false));
}
function genBech32(encoding) {
  const ENCODING_CONST = encoding === 'bech32' ? 1 : 0x2bc830a3;
  const _words = radix2(5);
  const fromWords = _words.decode;
  const toWords = _words.encode;
  const fromWordsUnsafe = unsafeWrapper(fromWords);
  function encode(prefix, words, limit = 90) {
    if (typeof prefix !== 'string') throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
    if (!Array.isArray(words) || words.length && typeof words[0] !== 'number') throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
    const actualLength = prefix.length + 7 + words.length;
    if (limit !== false && actualLength > limit) throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
    prefix = prefix.toLowerCase();
    return `${prefix}1${BECH_ALPHABET.encode(words)}${bechChecksum(prefix, words, ENCODING_CONST)}`;
  }
  function decode(str, limit = 90) {
    if (typeof str !== 'string') throw new Error(`bech32.decode input should be string, not ${typeof str}`);
    if (str.length < 8 || limit !== false && str.length > limit) throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
    const lowered = str.toLowerCase();
    if (str !== lowered && str !== str.toUpperCase()) throw new Error(`String must be lowercase or uppercase`);
    str = lowered;
    const sepIndex = str.lastIndexOf('1');
    if (sepIndex === 0 || sepIndex === -1) throw new Error(`Letter "1" must be present between prefix and data only`);
    const prefix = str.slice(0, sepIndex);
    const _words = str.slice(sepIndex + 1);
    if (_words.length < 6) throw new Error('Data must be at least 6 characters long');
    const words = BECH_ALPHABET.decode(_words).slice(0, -6);
    const sum = bechChecksum(prefix, words, ENCODING_CONST);
    if (!_words.endsWith(sum)) throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
    return {
      prefix,
      words
    };
  }
  const decodeUnsafe = unsafeWrapper(decode);
  function decodeToBytes(str) {
    const {
      prefix,
      words
    } = decode(str, false);
    return {
      prefix,
      words,
      bytes: fromWords(words)
    };
  }
  return {
    encode,
    decode,
    decodeToBytes,
    decodeUnsafe,
    fromWords,
    fromWordsUnsafe,
    toWords
  };
}
genBech32('bech32');
genBech32('bech32m');
const utf8 = {
  encode: data => new TextDecoder().decode(data),
  decode: str => new TextEncoder().encode(str)
};
const hex = chain(radix2(4), alphabet('0123456789abcdef'), join(''), normalize(s => {
  if (typeof s !== 'string' || s.length % 2) throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
  return s.toLowerCase();
}));
const CODERS = {
  utf8,
  hex,
  base16,
  base32,
  base64,
  base64url,
  base58,
  base58xmr
};
`Invalid encoding type. Available types: ${Object.keys(CODERS).join(', ')}`;

var CurveType;
(function (CurveType) {
  CurveType[CurveType["ED25519"] = 0] = "ED25519";
  CurveType[CurveType["SECP256K1"] = 1] = "SECP256K1";
})(CurveType || (CurveType = {}));

const U64_MAX = 2n ** 64n - 1n;
const EVICTED_REGISTER = U64_MAX - 1n;
function log(...params) {
  env.log(`${params.map(x => x === undefined ? 'undefined' : x) // Stringify undefined
  .map(x => typeof x === 'object' ? JSON.stringify(x) : x) // Convert Objects to strings
  .join(' ')}` // Convert to string
  );
}
function predecessorAccountId() {
  env.predecessor_account_id(0);
  return env.read_register(0);
}
function attachedDeposit() {
  return env.attached_deposit();
}
// NOTE: "env.panic(msg)" is not exported, use "throw Error(msg)" instead
function panicUtf8(msg) {
  env.panic_utf8(msg);
}
function storageRead(key) {
  let ret = env.storage_read(key, 0);
  if (ret === 1n) {
    return env.read_register(0);
  } else {
    return null;
  }
}
function storageHasKey(key) {
  let ret = env.storage_has_key(key);
  if (ret === 1n) {
    return true;
  } else {
    return false;
  }
}
function storageGetEvicted() {
  return env.read_register(EVICTED_REGISTER);
}
function currentAccountId() {
  env.current_account_id(0);
  return env.read_register(0);
}
function input() {
  env.input(0);
  return env.read_register(0);
}
function promiseBatchCreate(accountId) {
  return env.promise_batch_create(accountId);
}
function promiseBatchActionTransfer(promiseIndex, amount) {
  env.promise_batch_action_transfer(promiseIndex, amount);
}
function storageWrite(key, value) {
  let exist = env.storage_write(key, value, EVICTED_REGISTER);
  if (exist === 1n) {
    return true;
  }
  return false;
}
function storageRemove(key) {
  let exist = env.storage_remove(key, EVICTED_REGISTER);
  if (exist === 1n) {
    return true;
  }
  return false;
}

function initialize({}) {
  return function (target, key, descriptor) {};
}
function call({
  privateFunction = false,
  payableFunction = false
}) {
  return function (target, key, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args) {
      if (privateFunction && predecessorAccountId() !== currentAccountId()) {
        throw Error("Function is private");
      }
      if (!payableFunction && attachedDeposit() > BigInt(0)) {
        throw Error("Function is not payable");
      }
      return originalMethod.apply(this, args);
    };
  };
}
function view({}) {
  return function (target, key, descriptor) {};
}
function NearBindgen({
  requireInit = false
}) {
  return target => {
    return class extends target {
      static _create() {
        return new target();
      }
      static _getState() {
        const rawState = storageRead("STATE");
        return rawState ? this._deserialize(rawState) : null;
      }
      static _saveToStorage(obj) {
        storageWrite("STATE", this._serialize(obj));
      }
      static _getArgs() {
        return JSON.parse(input() || "{}");
      }
      static _serialize(value) {
        return JSON.stringify(value);
      }
      static _deserialize(value) {
        return JSON.parse(value);
      }
      static _reconstruct(classObject, plainObject) {
        for (const item in classObject) {
          if (classObject[item].constructor?.deserialize !== undefined) {
            classObject[item] = classObject[item].constructor.deserialize(plainObject[item]);
          } else {
            classObject[item] = plainObject[item];
          }
        }
        return classObject;
      }
      static _requireInit() {
        return requireInit;
      }
    };
  };
}

class LookupMap {
  constructor(keyPrefix) {
    this.keyPrefix = keyPrefix;
  }
  containsKey(key) {
    let storageKey = this.keyPrefix + JSON.stringify(key);
    return storageHasKey(storageKey);
  }
  get(key) {
    let storageKey = this.keyPrefix + JSON.stringify(key);
    let raw = storageRead(storageKey);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return null;
  }
  remove(key) {
    let storageKey = this.keyPrefix + JSON.stringify(key);
    if (storageRemove(storageKey)) {
      return JSON.parse(storageGetEvicted());
    }
    return null;
  }
  set(key, value) {
    let storageKey = this.keyPrefix + JSON.stringify(key);
    let storageValue = JSON.stringify(value);
    if (storageWrite(storageKey, storageValue)) {
      return JSON.parse(storageGetEvicted());
    }
    return null;
  }
  extend(objects) {
    for (let kv of objects) {
      this.set(kv[0], kv[1]);
    }
  }
  serialize() {
    return JSON.stringify(this);
  }
  // converting plain object to class object
  static deserialize(data) {
    return new LookupMap(data.keyPrefix);
  }
}

const ERR_INDEX_OUT_OF_BOUNDS = "Index out of bounds";
const ERR_INCONSISTENT_STATE$2 = "The collection is an inconsistent state. Did previous smart contract execution terminate unexpectedly?";
function indexToKey(prefix, index) {
  let data = new Uint32Array([index]);
  let array = new Uint8Array(data.buffer);
  let key = u8ArrayToBytes(array);
  return prefix + key;
}
/// An iterable implementation of vector that stores its content on the trie.
/// Uses the following map: index -> element
class Vector {
  constructor(prefix) {
    this.length = 0;
    this.prefix = prefix;
  }
  isEmpty() {
    return this.length == 0;
  }
  get(index) {
    if (index >= this.length) {
      return null;
    }
    let storageKey = indexToKey(this.prefix, index);
    return JSON.parse(storageRead(storageKey));
  }
  /// Removes an element from the vector and returns it in serialized form.
  /// The removed element is replaced by the last element of the vector.
  /// Does not preserve ordering, but is `O(1)`.
  swapRemove(index) {
    if (index >= this.length) {
      throw new Error(ERR_INDEX_OUT_OF_BOUNDS);
    } else if (index + 1 == this.length) {
      return this.pop();
    } else {
      let key = indexToKey(this.prefix, index);
      let last = this.pop();
      if (storageWrite(key, JSON.stringify(last))) {
        return JSON.parse(storageGetEvicted());
      } else {
        throw new Error(ERR_INCONSISTENT_STATE$2);
      }
    }
  }
  push(element) {
    let key = indexToKey(this.prefix, this.length);
    this.length += 1;
    storageWrite(key, JSON.stringify(element));
  }
  pop() {
    if (this.isEmpty()) {
      return null;
    } else {
      let lastIndex = this.length - 1;
      let lastKey = indexToKey(this.prefix, lastIndex);
      this.length -= 1;
      if (storageRemove(lastKey)) {
        return JSON.parse(storageGetEvicted());
      } else {
        throw new Error(ERR_INCONSISTENT_STATE$2);
      }
    }
  }
  replace(index, element) {
    if (index >= this.length) {
      throw new Error(ERR_INDEX_OUT_OF_BOUNDS);
    } else {
      let key = indexToKey(this.prefix, index);
      if (storageWrite(key, JSON.stringify(element))) {
        return JSON.parse(storageGetEvicted());
      } else {
        throw new Error(ERR_INCONSISTENT_STATE$2);
      }
    }
  }
  extend(elements) {
    for (let element of elements) {
      this.push(element);
    }
  }
  [Symbol.iterator]() {
    return new VectorIterator(this);
  }
  clear() {
    for (let i = 0; i < this.length; i++) {
      let key = indexToKey(this.prefix, i);
      storageRemove(key);
    }
    this.length = 0;
  }
  toArray() {
    let ret = [];
    for (let v of this) {
      ret.push(v);
    }
    return ret;
  }
  serialize() {
    return JSON.stringify(this);
  }
  // converting plain object to class object
  static deserialize(data) {
    let vector = new Vector(data.prefix);
    vector.length = data.length;
    return vector;
  }
}
class VectorIterator {
  constructor(vector) {
    this.current = 0;
    this.vector = vector;
  }
  next() {
    if (this.current < this.vector.length) {
      let value = this.vector.get(this.current);
      this.current += 1;
      return {
        value,
        done: false
      };
    }
    return {
      value: null,
      done: true
    };
  }
}

const ERR_INCONSISTENT_STATE$1 = "The collection is an inconsistent state. Did previous smart contract execution terminate unexpectedly?";
class UnorderedMap {
  constructor(prefix) {
    this.prefix = prefix;
    this.keys = new Vector(prefix + 'u'); // intentional different prefix with old UnorderedMap
    this.values = new LookupMap(prefix + 'm');
  }
  get length() {
    let keysLen = this.keys.length;
    return keysLen;
  }
  isEmpty() {
    let keysIsEmpty = this.keys.isEmpty();
    return keysIsEmpty;
  }
  get(key) {
    let valueAndIndex = this.values.get(key);
    if (valueAndIndex === null) {
      return null;
    }
    let value = valueAndIndex[0];
    return value;
  }
  set(key, value) {
    let valueAndIndex = this.values.get(key);
    if (valueAndIndex !== null) {
      let oldValue = valueAndIndex[0];
      valueAndIndex[0] = value;
      this.values.set(key, valueAndIndex);
      return oldValue;
    }
    let nextIndex = this.length;
    this.keys.push(key);
    this.values.set(key, [value, nextIndex]);
    return null;
  }
  remove(key) {
    let oldValueAndIndex = this.values.remove(key);
    if (oldValueAndIndex === null) {
      return null;
    }
    let index = oldValueAndIndex[1];
    if (this.keys.swapRemove(index) === null) {
      throw new Error(ERR_INCONSISTENT_STATE$1);
    }
    // the last key is swapped to key[index], the corresponding [value, index] need update
    if (this.keys.length > 0 && index != this.keys.length) {
      // if there is still elements and it was not the last element
      let swappedKey = this.keys.get(index);
      let swappedValueAndIndex = this.values.get(swappedKey);
      if (swappedValueAndIndex === null) {
        throw new Error(ERR_INCONSISTENT_STATE$1);
      }
      this.values.set(swappedKey, [swappedValueAndIndex[0], index]);
    }
    return oldValueAndIndex[0];
  }
  clear() {
    for (let key of this.keys) {
      // Set instead of remove to avoid loading the value from storage.
      this.values.set(key, null);
    }
    this.keys.clear();
  }
  toArray() {
    let ret = [];
    for (let v of this) {
      ret.push(v);
    }
    return ret;
  }
  [Symbol.iterator]() {
    return new UnorderedMapIterator(this);
  }
  extend(kvs) {
    for (let [k, v] of kvs) {
      this.set(k, v);
    }
  }
  serialize() {
    return JSON.stringify(this);
  }
  // converting plain object to class object
  static deserialize(data) {
    let map = new UnorderedMap(data.prefix);
    // reconstruct keys Vector
    map.keys = new Vector(data.prefix + "u");
    map.keys.length = data.keys.length;
    // reconstruct values LookupMap
    map.values = new LookupMap(data.prefix + "m");
    return map;
  }
}
class UnorderedMapIterator {
  constructor(unorderedMap) {
    this.keys = new VectorIterator(unorderedMap.keys);
    this.map = unorderedMap.values;
  }
  next() {
    let key = this.keys.next();
    let value;
    if (!key.done) {
      value = this.map.get(key.value);
      if (value === null) {
        throw new Error(ERR_INCONSISTENT_STATE$1);
      }
    }
    return {
      value: [key.value, value ? value[0] : value],
      done: key.done
    };
  }
}

const ERR_INCONSISTENT_STATE = "The collection is an inconsistent state. Did previous smart contract execution terminate unexpectedly?";
function serializeIndex(index) {
  let data = new Uint32Array([index]);
  let array = new Uint8Array(data.buffer);
  return u8ArrayToBytes(array);
}
function deserializeIndex(rawIndex) {
  let array = bytesToU8Array(rawIndex);
  let data = new Uint32Array(array.buffer);
  return data[0];
}
class UnorderedSet {
  constructor(prefix) {
    this.prefix = prefix;
    this.elementIndexPrefix = prefix + "i";
    let elementsPrefix = prefix + "e";
    this.elements = new Vector(elementsPrefix);
  }
  get length() {
    return this.elements.length;
  }
  isEmpty() {
    return this.elements.isEmpty();
  }
  contains(element) {
    let indexLookup = this.elementIndexPrefix + JSON.stringify(element);
    return storageHasKey(indexLookup);
  }
  set(element) {
    let indexLookup = this.elementIndexPrefix + JSON.stringify(element);
    if (storageRead(indexLookup)) {
      return false;
    } else {
      let nextIndex = this.length;
      let nextIndexRaw = serializeIndex(nextIndex);
      storageWrite(indexLookup, nextIndexRaw);
      this.elements.push(element);
      return true;
    }
  }
  remove(element) {
    let indexLookup = this.elementIndexPrefix + JSON.stringify(element);
    let indexRaw = storageRead(indexLookup);
    if (indexRaw) {
      if (this.length == 1) {
        // If there is only one element then swap remove simply removes it without
        // swapping with the last element.
        storageRemove(indexLookup);
      } else {
        // If there is more than one element then swap remove swaps it with the last
        // element.
        let lastElement = this.elements.get(this.length - 1);
        if (!lastElement) {
          throw new Error(ERR_INCONSISTENT_STATE);
        }
        storageRemove(indexLookup);
        // If the removed element was the last element from keys, then we don't need to
        // reinsert the lookup back.
        if (lastElement != element) {
          let lastLookupElement = this.elementIndexPrefix + JSON.stringify(lastElement);
          storageWrite(lastLookupElement, indexRaw);
        }
      }
      let index = deserializeIndex(indexRaw);
      this.elements.swapRemove(index);
      return true;
    }
    return false;
  }
  clear() {
    for (let element of this.elements) {
      let indexLookup = this.elementIndexPrefix + JSON.stringify(element);
      storageRemove(indexLookup);
    }
    this.elements.clear();
  }
  toArray() {
    let ret = [];
    for (let v of this) {
      ret.push(v);
    }
    return ret;
  }
  [Symbol.iterator]() {
    return this.elements[Symbol.iterator]();
  }
  extend(elements) {
    for (let element of elements) {
      this.set(element);
    }
  }
  serialize() {
    return JSON.stringify(this);
  }
  // converting plain object to class object
  static deserialize(data) {
    let set = new UnorderedSet(data.prefix);
    // reconstruct Vector
    let elementsPrefix = data.prefix + "e";
    set.elements = new Vector(elementsPrefix);
    set.elements.length = data.elements.length;
    return set;
  }
}

function restoreOwners(collection) {
  if (collection == null) {
    return null;
  }
  return UnorderedSet.deserialize(collection);
}
function internalAddTokenToOwner({
  contract,
  accountId,
  tokenId
}) {
  let tokenSet = restoreOwners(contract.tokensPerOwner.get(accountId));
  if (tokenSet == null) {
    tokenSet = new UnorderedSet("tokensPerOwner-" + accountId);
  }
  tokenSet.set(tokenId);

  // Insert to owner
  contract.tokensPerOwner.set(accountId, tokenSet);
}
function internalRemoveTokenFromOwner({
  contract,
  accountId,
  tokenId
}) {
  let tokenSet = restoreOwners(contract.tokensPerOwner.get(accountId));
  if (tokenSet == null) {
    panicUtf8("Token should be owned by the sender");
  }
  tokenSet.remove(tokenId);
  if (tokenSet.isEmpty()) {
    contract.tokensPerOwner.remove(accountId);
  } else {
    contract.tokensPerOwner.set(accountId, tokenSet);
  }
}

class NFTContractMetadata {
  constructor({
    spec,
    name,
    symbol,
    icon,
    baseUri,
    reference,
    referenceHash
  }) {
    this.spec = spec; // required, essentially a version like "nft-1.0.0"
    this.name = name; // required, ex. "Mosaics"
    this.symbol = symbol; // required, ex. "MOSAIC"
    this.icon = icon; // Data URL
    this.base_uri = baseUri; // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
    this.reference = reference; // URL to a JSON file with more info
    this.reference_hash = referenceHash; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
  }
}

class Token {
  constructor({
    ownerId
  }) {
    this.owner_id = ownerId;
  }
}
// Data transfer object
class JsonToken {
  constructor({
    tokenId,
    ownerId,
    metadata
  }) {
    this.token_id = tokenId;
    this.owner_id = ownerId;
    this.metadata = metadata;
  }
}

function internalTotalSupply({
  contract
}) {
  return contract.tokenMetadataById.length;
}
function internalSupplyForOwner({
  contract,
  accountId
}) {
  let tokens = restoreOwners(contract.tokensPerOwner.get(accountId));
  if (tokens == null) {
    return 0;
  }
  return tokens.length;
}
function internalNftToken({
  contract,
  tokenId
}) {
  let token = contract.tokensById.get(tokenId);
  if (token == null) {
    return null;
  }
  let metadata = contract.tokenMetadataById.get(tokenId);
  return new JsonToken({
    tokenId,
    ownerId: token.owner_id,
    metadata
  });
}
function internalNftTokens({
  contract,
  fromIndex,
  limit
}) {
  let tokens = [];
  let start = fromIndex ? parseInt(fromIndex) : 0;
  let max = limit ? limit : 50;
  let keys = contract.tokenMetadataById.toArray();
  for (let i = start; i < keys.length && i < start + max; i++) {
    let jsonToken = internalNftToken({
      contract,
      tokenId: keys[i][0]
    });
    tokens.push(jsonToken);
  }
  return tokens;
}
function internalNftTokensForOwner({
  contract,
  accountId,
  fromIndex,
  limit
}) {
  let tokens = [];
  let start = fromIndex ? parseInt(fromIndex) : 0;
  let max = limit ? limit : 50;
  let tokenSet = restoreOwners(contract.tokensPerOwner.get(accountId));
  if (tokenSet == null) return [];
  let keys = tokenSet.toArray();
  for (let i = start; i < max; i++) {
    if (i >= keys.length) {
      break;
    }
    let token = internalNftToken({
      contract,
      tokenId: keys[i]
    });
    tokens.push(token);
  }
  return tokens;
}

class Sale {
  constructor({
    owner_id,
    token_id,
    price
  }) {
    this.owner_id = owner_id;
    this.token_id = token_id;
    this.price = price;
  }
}
class JsonSale {
  constructor({
    sale_id,
    owner_id,
    price,
    token
  }) {
    this.sale_id = sale_id;
    this.owner_id = owner_id;
    this.price = price;
    this.token = token;
  }
}

function assertOneYocto() {
  // 1 NEAR = 10^24 yoctoNEAR
  assert(attachedDeposit().toString() === "1", "Requires attached deposit of exactly 1 yoctoNEAR");
}

/**
 * 1. Validate data
 * 2. Xoá owner hiện tại NFT
 * 3. Thêm owner mới cho NFT
 */
function internalNftTransfer({
  contract,
  receiverId,
  tokenId,
  memo
}) {
  let token = contract.tokensById.get(tokenId);
  let senderId = predecessorAccountId();
  if (token == null) {
    panicUtf8("Not found token");
  }
  assert(senderId == token.owner_id, "Unauthorized");
  assert(receiverId != token.owner_id, "The token owner and the receiver should be different");
  internalRemoveTokenFromOwner({
    contract,
    accountId: token.owner_id,
    tokenId
  });
  internalAddTokenToOwner({
    contract,
    accountId: receiverId,
    tokenId
  });
  let newToken = new Token({
    ownerId: receiverId
  });
  contract.tokensById.set(tokenId, newToken);
  if (memo != null) {
    log(`Memo: ${memo}`);
  }
  let nftTransferLog = {
    standard: NFT_STANDARD_NAME,
    version: NFT_METADATA_SPEC,
    event: "nft_transfer",
    data: [{
      authorized_id: senderId,
      old_owner_id: token.owner_id,
      new_owner_id: receiverId,
      token_ids: [tokenId],
      memo
    }]
  };

  // Log the serialized json
  log(`EVENT_JSON:${JSON.stringify(nftTransferLog)}`);
  return token;
}
function internalOfferNftTransfer({
  contract,
  receiverId,
  senderId,
  tokenId,
  memo
}) {
  let token = contract.tokensById.get(tokenId);
  if (token == null) {
    panicUtf8("Not found token");
  }
  assert(senderId == token.owner_id, "Unauthorized");
  assert(receiverId != token.owner_id, "The token owner and the receiver should be different");
  internalRemoveTokenFromOwner({
    contract,
    accountId: token.owner_id,
    tokenId
  });
  internalAddTokenToOwner({
    contract,
    accountId: receiverId,
    tokenId
  });
  let newToken = new Token({
    ownerId: receiverId
  });
  contract.tokensById.set(tokenId, newToken);
  if (memo != null) {
    log(`Memo: ${memo}`);
  }
  let nftTransferLog = {
    standard: NFT_STANDARD_NAME,
    version: NFT_METADATA_SPEC,
    event: "nft_transfer",
    data: [{
      authorized_id: senderId,
      old_owner_id: token.owner_id,
      new_owner_id: receiverId,
      token_ids: [tokenId],
      memo
    }]
  };

  // Log the serialized json
  log(`EVENT_JSON:${JSON.stringify(nftTransferLog)}`);
  return token;
}

function internalAddSale({
  contract,
  token_id,
  price
}) {
  let senderId = predecessorAccountId();
  let token = contract.tokensById.get(token_id);
  if (token == null) {
    panicUtf8("Not found token");
  }
  assert(senderId == token.owner_id, "Unauthorized");
  let sale = new Sale({
    owner_id: senderId,
    token_id,
    price
  });
  contract.nextSaleId++;
  let saleId = contract.nextSaleId.toString();
  contract.sales.set(saleId, sale);
  internalAddSaleByOwner({
    contract,
    accountId: senderId,
    saleId
  });
}
function internalAddSaleByOwner({
  contract,
  accountId,
  saleId
}) {
  let saleSet = restoreOwners(contract.salesByOwnerId.get(accountId));
  if (saleSet == null) {
    saleSet = new UnorderedSet("saleByOwner-" + accountId);
  }
  saleSet.set(saleId);
  contract.salesByOwnerId.set(accountId, saleSet);
}
function internalRemoveSale({
  contract,
  sale_id
}) {
  let sale = contract.sales.remove(sale_id);
  if (sale == null) {
    panicUtf8("No sale");
  }
  let byOwnerId = restoreOwners(contract.salesByOwnerId.get(sale.owner_id));
  if (byOwnerId == null) {
    panicUtf8("No sale by owner");
  }
  byOwnerId.remove(sale_id);
  if (byOwnerId.isEmpty()) {
    contract.salesByOwnerId.remove(sale.owner_id);
  } else {
    contract.salesByOwnerId.set(sale.owner_id, byOwnerId);
  }
  return sale;
}
function internalGetSale({
  contract,
  sale_id
}) {
  let sale = contract.sales.get(sale_id);
  let tokenMetadata = contract.tokenMetadataById.get(sale.token_id);
  let token = new JsonToken({
    tokenId: sale.token_id,
    ownerId: sale.owner_id,
    metadata: tokenMetadata
  });
  let jsonSale = new JsonSale({
    sale_id,
    owner_id: sale.owner_id,
    price: sale.price,
    token
  });
  return jsonSale;
}
function internalGetSales({
  contract
}) {
  let sales = [];
  let keys = contract.sales.toArray();
  for (let i = 0; i < keys.length; i++) {
    let jsonSale = internalGetSale({
      contract,
      sale_id: keys[i][0]
    });
    sales.push(jsonSale);
  }
  return sales;
}

/**
 * 1. Validate data
 * 2. Transfer NFT cho nguoi mua
 * 3. Transfer token cho ng ban
 * 4. Remove sale
 */
function internalBuyNft({
  contract,
  sale_id
}) {
  let sale = contract.sales.get(sale_id);
  if (sale == null) {
    panicUtf8("Sale not found");
  }
  let deposit = attachedDeposit().valueOf();
  assert(deposit > 0, "deposit must be greater than 0");
  let price = BigInt(sale.price);
  assert(deposit >= price, "deposit must ne greater than or equal to price");
  let buyerId = predecessorAccountId();
  assert(buyerId != sale.owner_id, "you can't offer on your sale");

  // 2. transfer nft to buyer
  internalOfferNftTransfer({
    contract,
    receiverId: buyerId,
    senderId: sale.owner_id,
    tokenId: sale.token_id,
    memo: "Buy from marketplace"
  });

  // 3. transfer NEAR to owner
  const promise = promiseBatchCreate(sale.owner_id);
  // Action transfer NEAR
  promiseBatchActionTransfer(promise, price);

  // 4. remove sale
  internalRemoveSale({
    contract,
    sale_id
  });
}

function internalMintNFT({
  contract,
  tokenId,
  metadata,
  receiverId
}) {
  let token = new Token({
    ownerId: receiverId
  });
  assert(!contract.tokensById.containsKey(tokenId), "Token already exists");

  // Insert token
  contract.tokensById.set(tokenId, token);

  // Add token owner
  internalAddTokenToOwner({
    contract,
    accountId: receiverId,
    tokenId
  });

  // insert token id and metadata
  contract.tokenMetadataById.set(tokenId, metadata);

  // NFT Mint events
  let nftMintLog = {
    standard: NFT_STANDARD_NAME,
    version: NFT_METADATA_SPEC,
    event: "nft_mint",
    data: [{
      owner_id: token.owner_id,
      token_ids: [tokenId]
    }]
  };
  log(`EVENT_JSON:${JSON.stringify(nftMintLog)}`);
}

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _class, _class2;
/// This spec can be treated like a version of the standard.
const NFT_METADATA_SPEC = "nft-1.0.0";

/// This is the name of the NFT standard we're using
const NFT_STANDARD_NAME = "nep171";
let Contract = (_dec = NearBindgen({}), _dec2 = initialize({
  privateFunction: true
}), _dec3 = call({
  payableFunction: true
}), _dec4 = call({
  payableFunction: true
}), _dec5 = call({
  payableFunction: true
}), _dec6 = call({
  privateFunction: true
}), _dec7 = view({}), _dec8 = view({}), _dec9 = view({}), _dec10 = view({}), _dec11 = view({}), _dec12 = view({}), _dec13 = call({
  payableFunction: true
}), _dec14 = call({
  payableFunction: true
}), _dec15 = call({
  payableFunction: true
}), _dec16 = call({
  payableFunction: true
}), _dec17 = view({}), _dec18 = view({}), _dec(_class = (_class2 = class Contract {
  tokensPerOwner = new LookupMap("tokensPerOwner"); // {accountId, Set<TokenID>}
  tokensById = new LookupMap("tokensById"); // {tokenId, Token}
  tokenMetadataById = new UnorderedMap("tokenMetadataById"); // {tokenId, TokenMetadata}
  metadata = new NFTContractMetadata({
    spec: "nft-1.0.0",
    name: "BKHCM Tutorial Contract",
    symbol: "BKHCM-NFT"
  });

  // Marketplace
  nextSaleId = 0;
  sales = new UnorderedMap("sales"); // {saleId, Sale};
  salesByOwnerId = new LookupMap("salesByOwnerId"); // {accountId, Set<saleId>}

  init({
    owner_id
  }) {
    this.owner_id = owner_id;
  }

  /**
   * Mint NFT
   */
  nft_mint({
    token_id,
    metadata,
    receiver_id
  }) {
    internalMintNFT({
      contract: this,
      tokenId: token_id,
      metadata,
      receiverId: receiver_id
    });
  }
  nft_transfer({
    receiver_id,
    token_id,
    approval_id,
    memo
  }) {
    assertOneYocto();
    internalNftTransfer({
      contract: this,
      receiverId: receiver_id,
      tokenId: token_id,
      memo
    });
  }
  nft_transfer_call({
    receiver_id,
    token_id,
    approval_id,
    memo,
    msg
  }) {}
  nft_resolve_transfer({
    owner_id,
    receiver_id,
    token_id,
    approved_account_ids
  }) {}
  nft_total_supply() {
    return internalTotalSupply({
      contract: this
    }).toString();
  }
  nft_supply_for_owner({
    account_id
  }) {
    return internalSupplyForOwner({
      contract: this,
      accountId: account_id
    }).toString();
  }
  nft_tokens({
    from_index,
    limit
  }) {
    return internalNftTokens({
      contract: this,
      fromIndex: from_index,
      limit
    });
  }
  nft_token({
    token_id
  }) {
    return internalNftToken({
      contract: this,
      tokenId: token_id
    });
  }
  nft_tokens_for_owner({
    account_id,
    from_index,
    limit
  }) {
    return internalNftTokensForOwner({
      contract: this,
      accountId: account_id,
      fromIndex: from_index,
      limit
    });
  }
  nft_metadata() {
    return this.metadata;
  }

  // marketplace
  add_sale({
    token_id,
    price
  }) {
    assertOneYocto();
    // TODO: handle add sale
    internalAddSale({
      contract: this,
      token_id,
      price
    });
  }
  remove_sale({
    sale_id
  }) {
    assertOneYocto();
    internalRemoveSale({
      contract: this,
      sale_id
    });
  }
  update_price({
    sale_id,
    price
  }) {
    assertOneYocto();
  }
  buy({
    sale_id
  }) {
    internalBuyNft({
      contract: this,
      sale_id
    });
  }
  get_sales() {
    return internalGetSales({
      contract: this
    });
  }
  get_sale({
    sale_id
  }) {
    return internalGetSale({
      contract: this,
      sale_id
    });
  }
}, (_applyDecoratedDescriptor(_class2.prototype, "init", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "init"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_mint", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_mint"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_transfer", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_transfer"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_transfer_call", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_transfer_call"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_resolve_transfer", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_resolve_transfer"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_total_supply", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_total_supply"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_supply_for_owner", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_supply_for_owner"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_tokens", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_tokens"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_token", [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_token"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_tokens_for_owner", [_dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_tokens_for_owner"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nft_metadata", [_dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "nft_metadata"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "add_sale", [_dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "add_sale"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "remove_sale", [_dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "remove_sale"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "update_price", [_dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "update_price"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "buy", [_dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "buy"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_sales", [_dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "get_sales"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_sale", [_dec18], Object.getOwnPropertyDescriptor(_class2.prototype, "get_sale"), _class2.prototype)), _class2)) || _class);
function get_sale() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.get_sale(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function get_sales() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.get_sales(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function buy() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.buy(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function update_price() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.update_price(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function remove_sale() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.remove_sale(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function add_sale() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.add_sale(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function nft_metadata() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.nft_metadata(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function nft_tokens_for_owner() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.nft_tokens_for_owner(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function nft_token() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.nft_token(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function nft_tokens() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.nft_tokens(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function nft_supply_for_owner() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.nft_supply_for_owner(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function nft_total_supply() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.nft_total_supply(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function nft_resolve_transfer() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.nft_resolve_transfer(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function nft_transfer_call() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.nft_transfer_call(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function nft_transfer() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.nft_transfer(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function nft_mint() {
  let _state = Contract._getState();
  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  let _contract = Contract._create();
  if (_state) {
    Contract._reconstruct(_contract, _state);
  }
  let _args = Contract._getArgs();
  let _result = _contract.nft_mint(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function init() {
  let _state = Contract._getState();
  if (_state) throw new Error("Contract already initialized");
  let _contract = Contract._create();
  let _args = Contract._getArgs();
  let _result = _contract.init(_args);
  Contract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}

export { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME, add_sale, buy, get_sale, get_sales, init, nft_metadata, nft_mint, nft_resolve_transfer, nft_supply_for_owner, nft_token, nft_tokens, nft_tokens_for_owner, nft_total_supply, nft_transfer, nft_transfer_call, remove_sale, update_price };
//# sourceMappingURL=contract.js.map
