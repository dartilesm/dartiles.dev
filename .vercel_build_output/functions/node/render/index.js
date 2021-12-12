var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data2 = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data2, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* toIterator(parts, clone2 = true) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else if (ArrayBuffer.isView(part)) {
      if (clone2) {
        let position = part.byteOffset;
        const end = part.byteOffset + part.byteLength;
        while (position !== end) {
          const size = Math.min(end - position, POOL_SIZE);
          const chunk = part.buffer.slice(position, position + size);
          position += chunk.byteLength;
          yield new Uint8Array(chunk);
        }
      } else {
        yield part;
      }
    } else {
      let position = 0;
      while (position !== part.size) {
        const chunk = part.slice(position, Math.min(part.size, position + POOL_SIZE));
        const buffer = await chunk.arrayBuffer();
        position += buffer.byteLength;
        yield new Uint8Array(buffer);
      }
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    length += isBlob(value) ? value.size : Buffer.byteLength(String(value));
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data2) {
  if (data2[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data2.url}`);
  }
  data2[INTERNALS$2].disturbed = true;
  if (data2[INTERNALS$2].error) {
    throw data2[INTERNALS$2].error;
  }
  let { body } = data2;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = import_stream.default.Readable.from(body.stream());
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data2.size > 0 && accumBytes + chunk.length > data2.size) {
        const error2 = new FetchError(`content size at ${data2.url} over limit: ${data2.size}`, "max-size");
        body.destroy(error2);
        throw error2;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error2) {
    const error_ = error2 instanceof FetchBaseError ? error2 : new FetchError(`Invalid response body while trying to fetch ${data2.url}: ${error2.message}`, "system", error2);
    throw error_;
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data2.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data2.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index, array) => {
    if (index % 2 === 0) {
      result.push(array.slice(index, index + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data2 = dataUriToBuffer$1(request.url);
      const response2 = new Response(data2, { headers: { "Content-Type": data2.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error2 = new AbortError("The operation was aborted.");
      reject(error2);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (error2) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${error2.message}`, "system", error2));
      finalize();
    });
    fixResponseChunkedTransferBadEnding(request_, (error2) => {
      response.body.destroy(error2);
    });
    if (process.version < "v14") {
      request_.on("socket", (s2) => {
        let endedWithEventsCount;
        s2.prependListener("end", () => {
          endedWithEventsCount = s2._eventsCount;
        });
        s2.prependListener("close", (hadError) => {
          if (response && endedWithEventsCount < s2._eventsCount && !hadError) {
            const error2 = new Error("Premature close");
            error2.code = "ERR_STREAM_PREMATURE_CLOSE";
            response.body.emit("error", error2);
          }
        });
      });
    }
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              headers.set("Location", locationURL);
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
          default:
            return reject(new TypeError(`Redirect option '${request.redirect}' is not a valid value of RequestRedirect`));
        }
      }
      if (signal) {
        response_.once("end", () => {
          signal.removeEventListener("abort", abortAndFinalize);
        });
      }
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), reject);
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
        raw.once("data", (chunk) => {
          body = (chunk[0] & 15) === 8 ? (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), reject) : (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), reject);
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), reject);
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
function fixResponseChunkedTransferBadEnding(request, errorCallback) {
  const LAST_CHUNK = Buffer.from("0\r\n\r\n");
  let isChunkedTransfer = false;
  let properLastChunkReceived = false;
  let previousChunk;
  request.on("response", (response) => {
    const { headers } = response;
    isChunkedTransfer = headers["transfer-encoding"] === "chunked" && !headers["content-length"];
  });
  request.on("socket", (socket) => {
    const onSocketClose = () => {
      if (isChunkedTransfer && !properLastChunkReceived) {
        const error2 = new Error("Premature close");
        error2.code = "ERR_STREAM_PREMATURE_CLOSE";
        errorCallback(error2);
      }
    };
    socket.prependListener("close", onSocketClose);
    request.on("abort", () => {
      socket.removeListener("close", onSocketClose);
    });
    socket.on("data", (buf) => {
      properLastChunkReceived = Buffer.compare(buf.slice(-5), LAST_CHUNK) === 0;
      if (!properLastChunkReceived && previousChunk) {
        properLastChunkReceived = Buffer.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) === 0 && Buffer.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0;
      }
      previousChunk = buf;
    });
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, commonjsGlobal, src, dataUriToBuffer$1, ponyfill_es2018, POOL_SIZE$1, POOL_SIZE, _Blob, Blob2, Blob$1, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
    src = dataUriToBuffer;
    dataUriToBuffer$1 = src;
    ponyfill_es2018 = { exports: {} };
    (function(module2, exports) {
      (function(global2, factory) {
        factory(exports);
      })(commonjsGlobal, function(exports2) {
        const SymbolPolyfill = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? Symbol : (description) => `Symbol(${description})`;
        function noop2() {
          return void 0;
        }
        function getGlobals() {
          if (typeof self !== "undefined") {
            return self;
          } else if (typeof window !== "undefined") {
            return window;
          } else if (typeof commonjsGlobal !== "undefined") {
            return commonjsGlobal;
          }
          return void 0;
        }
        const globals = getGlobals();
        function typeIsObject(x) {
          return typeof x === "object" && x !== null || typeof x === "function";
        }
        const rethrowAssertionErrorRejection = noop2;
        const originalPromise = Promise;
        const originalPromiseThen = Promise.prototype.then;
        const originalPromiseResolve = Promise.resolve.bind(originalPromise);
        const originalPromiseReject = Promise.reject.bind(originalPromise);
        function newPromise(executor) {
          return new originalPromise(executor);
        }
        function promiseResolvedWith(value) {
          return originalPromiseResolve(value);
        }
        function promiseRejectedWith(reason) {
          return originalPromiseReject(reason);
        }
        function PerformPromiseThen(promise, onFulfilled, onRejected) {
          return originalPromiseThen.call(promise, onFulfilled, onRejected);
        }
        function uponPromise(promise, onFulfilled, onRejected) {
          PerformPromiseThen(PerformPromiseThen(promise, onFulfilled, onRejected), void 0, rethrowAssertionErrorRejection);
        }
        function uponFulfillment(promise, onFulfilled) {
          uponPromise(promise, onFulfilled);
        }
        function uponRejection(promise, onRejected) {
          uponPromise(promise, void 0, onRejected);
        }
        function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
          return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler);
        }
        function setPromiseIsHandledToTrue(promise) {
          PerformPromiseThen(promise, void 0, rethrowAssertionErrorRejection);
        }
        const queueMicrotask = (() => {
          const globalQueueMicrotask = globals && globals.queueMicrotask;
          if (typeof globalQueueMicrotask === "function") {
            return globalQueueMicrotask;
          }
          const resolvedPromise = promiseResolvedWith(void 0);
          return (fn) => PerformPromiseThen(resolvedPromise, fn);
        })();
        function reflectCall(F, V, args) {
          if (typeof F !== "function") {
            throw new TypeError("Argument is not a function");
          }
          return Function.prototype.apply.call(F, V, args);
        }
        function promiseCall(F, V, args) {
          try {
            return promiseResolvedWith(reflectCall(F, V, args));
          } catch (value) {
            return promiseRejectedWith(value);
          }
        }
        const QUEUE_MAX_ARRAY_SIZE = 16384;
        class SimpleQueue {
          constructor() {
            this._cursor = 0;
            this._size = 0;
            this._front = {
              _elements: [],
              _next: void 0
            };
            this._back = this._front;
            this._cursor = 0;
            this._size = 0;
          }
          get length() {
            return this._size;
          }
          push(element) {
            const oldBack = this._back;
            let newBack = oldBack;
            if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
              newBack = {
                _elements: [],
                _next: void 0
              };
            }
            oldBack._elements.push(element);
            if (newBack !== oldBack) {
              this._back = newBack;
              oldBack._next = newBack;
            }
            ++this._size;
          }
          shift() {
            const oldFront = this._front;
            let newFront = oldFront;
            const oldCursor = this._cursor;
            let newCursor = oldCursor + 1;
            const elements = oldFront._elements;
            const element = elements[oldCursor];
            if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
              newFront = oldFront._next;
              newCursor = 0;
            }
            --this._size;
            this._cursor = newCursor;
            if (oldFront !== newFront) {
              this._front = newFront;
            }
            elements[oldCursor] = void 0;
            return element;
          }
          forEach(callback) {
            let i = this._cursor;
            let node = this._front;
            let elements = node._elements;
            while (i !== elements.length || node._next !== void 0) {
              if (i === elements.length) {
                node = node._next;
                elements = node._elements;
                i = 0;
                if (elements.length === 0) {
                  break;
                }
              }
              callback(elements[i]);
              ++i;
            }
          }
          peek() {
            const front = this._front;
            const cursor = this._cursor;
            return front._elements[cursor];
          }
        }
        function ReadableStreamReaderGenericInitialize(reader, stream) {
          reader._ownerReadableStream = stream;
          stream._reader = reader;
          if (stream._state === "readable") {
            defaultReaderClosedPromiseInitialize(reader);
          } else if (stream._state === "closed") {
            defaultReaderClosedPromiseInitializeAsResolved(reader);
          } else {
            defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError);
          }
        }
        function ReadableStreamReaderGenericCancel(reader, reason) {
          const stream = reader._ownerReadableStream;
          return ReadableStreamCancel(stream, reason);
        }
        function ReadableStreamReaderGenericRelease(reader) {
          if (reader._ownerReadableStream._state === "readable") {
            defaultReaderClosedPromiseReject(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
          } else {
            defaultReaderClosedPromiseResetToRejected(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
          }
          reader._ownerReadableStream._reader = void 0;
          reader._ownerReadableStream = void 0;
        }
        function readerLockException(name) {
          return new TypeError("Cannot " + name + " a stream using a released reader");
        }
        function defaultReaderClosedPromiseInitialize(reader) {
          reader._closedPromise = newPromise((resolve2, reject) => {
            reader._closedPromise_resolve = resolve2;
            reader._closedPromise_reject = reject;
          });
        }
        function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
          defaultReaderClosedPromiseInitialize(reader);
          defaultReaderClosedPromiseReject(reader, reason);
        }
        function defaultReaderClosedPromiseInitializeAsResolved(reader) {
          defaultReaderClosedPromiseInitialize(reader);
          defaultReaderClosedPromiseResolve(reader);
        }
        function defaultReaderClosedPromiseReject(reader, reason) {
          if (reader._closedPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(reader._closedPromise);
          reader._closedPromise_reject(reason);
          reader._closedPromise_resolve = void 0;
          reader._closedPromise_reject = void 0;
        }
        function defaultReaderClosedPromiseResetToRejected(reader, reason) {
          defaultReaderClosedPromiseInitializeAsRejected(reader, reason);
        }
        function defaultReaderClosedPromiseResolve(reader) {
          if (reader._closedPromise_resolve === void 0) {
            return;
          }
          reader._closedPromise_resolve(void 0);
          reader._closedPromise_resolve = void 0;
          reader._closedPromise_reject = void 0;
        }
        const AbortSteps = SymbolPolyfill("[[AbortSteps]]");
        const ErrorSteps = SymbolPolyfill("[[ErrorSteps]]");
        const CancelSteps = SymbolPolyfill("[[CancelSteps]]");
        const PullSteps = SymbolPolyfill("[[PullSteps]]");
        const NumberIsFinite = Number.isFinite || function(x) {
          return typeof x === "number" && isFinite(x);
        };
        const MathTrunc = Math.trunc || function(v) {
          return v < 0 ? Math.ceil(v) : Math.floor(v);
        };
        function isDictionary(x) {
          return typeof x === "object" || typeof x === "function";
        }
        function assertDictionary(obj, context) {
          if (obj !== void 0 && !isDictionary(obj)) {
            throw new TypeError(`${context} is not an object.`);
          }
        }
        function assertFunction(x, context) {
          if (typeof x !== "function") {
            throw new TypeError(`${context} is not a function.`);
          }
        }
        function isObject(x) {
          return typeof x === "object" && x !== null || typeof x === "function";
        }
        function assertObject(x, context) {
          if (!isObject(x)) {
            throw new TypeError(`${context} is not an object.`);
          }
        }
        function assertRequiredArgument(x, position, context) {
          if (x === void 0) {
            throw new TypeError(`Parameter ${position} is required in '${context}'.`);
          }
        }
        function assertRequiredField(x, field, context) {
          if (x === void 0) {
            throw new TypeError(`${field} is required in '${context}'.`);
          }
        }
        function convertUnrestrictedDouble(value) {
          return Number(value);
        }
        function censorNegativeZero(x) {
          return x === 0 ? 0 : x;
        }
        function integerPart(x) {
          return censorNegativeZero(MathTrunc(x));
        }
        function convertUnsignedLongLongWithEnforceRange(value, context) {
          const lowerBound = 0;
          const upperBound = Number.MAX_SAFE_INTEGER;
          let x = Number(value);
          x = censorNegativeZero(x);
          if (!NumberIsFinite(x)) {
            throw new TypeError(`${context} is not a finite number`);
          }
          x = integerPart(x);
          if (x < lowerBound || x > upperBound) {
            throw new TypeError(`${context} is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`);
          }
          if (!NumberIsFinite(x) || x === 0) {
            return 0;
          }
          return x;
        }
        function assertReadableStream(x, context) {
          if (!IsReadableStream(x)) {
            throw new TypeError(`${context} is not a ReadableStream.`);
          }
        }
        function AcquireReadableStreamDefaultReader(stream) {
          return new ReadableStreamDefaultReader(stream);
        }
        function ReadableStreamAddReadRequest(stream, readRequest) {
          stream._reader._readRequests.push(readRequest);
        }
        function ReadableStreamFulfillReadRequest(stream, chunk, done) {
          const reader = stream._reader;
          const readRequest = reader._readRequests.shift();
          if (done) {
            readRequest._closeSteps();
          } else {
            readRequest._chunkSteps(chunk);
          }
        }
        function ReadableStreamGetNumReadRequests(stream) {
          return stream._reader._readRequests.length;
        }
        function ReadableStreamHasDefaultReader(stream) {
          const reader = stream._reader;
          if (reader === void 0) {
            return false;
          }
          if (!IsReadableStreamDefaultReader(reader)) {
            return false;
          }
          return true;
        }
        class ReadableStreamDefaultReader {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "ReadableStreamDefaultReader");
            assertReadableStream(stream, "First parameter");
            if (IsReadableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive reading by another reader");
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readRequests = new SimpleQueue();
          }
          get closed() {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          cancel(reason = void 0) {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("cancel"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("cancel"));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
          }
          read() {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("read"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("read from"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readRequest = {
              _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
              _closeSteps: () => resolvePromise({ value: void 0, done: true }),
              _errorSteps: (e) => rejectPromise(e)
            };
            ReadableStreamDefaultReaderRead(this, readRequest);
            return promise;
          }
          releaseLock() {
            if (!IsReadableStreamDefaultReader(this)) {
              throw defaultReaderBrandCheckException("releaseLock");
            }
            if (this._ownerReadableStream === void 0) {
              return;
            }
            if (this._readRequests.length > 0) {
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            }
            ReadableStreamReaderGenericRelease(this);
          }
        }
        Object.defineProperties(ReadableStreamDefaultReader.prototype, {
          cancel: { enumerable: true },
          read: { enumerable: true },
          releaseLock: { enumerable: true },
          closed: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamDefaultReader.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamDefaultReader",
            configurable: true
          });
        }
        function IsReadableStreamDefaultReader(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readRequests")) {
            return false;
          }
          return x instanceof ReadableStreamDefaultReader;
        }
        function ReadableStreamDefaultReaderRead(reader, readRequest) {
          const stream = reader._ownerReadableStream;
          stream._disturbed = true;
          if (stream._state === "closed") {
            readRequest._closeSteps();
          } else if (stream._state === "errored") {
            readRequest._errorSteps(stream._storedError);
          } else {
            stream._readableStreamController[PullSteps](readRequest);
          }
        }
        function defaultReaderBrandCheckException(name) {
          return new TypeError(`ReadableStreamDefaultReader.prototype.${name} can only be used on a ReadableStreamDefaultReader`);
        }
        const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
        }).prototype);
        class ReadableStreamAsyncIteratorImpl {
          constructor(reader, preventCancel) {
            this._ongoingPromise = void 0;
            this._isFinished = false;
            this._reader = reader;
            this._preventCancel = preventCancel;
          }
          next() {
            const nextSteps = () => this._nextSteps();
            this._ongoingPromise = this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps) : nextSteps();
            return this._ongoingPromise;
          }
          return(value) {
            const returnSteps = () => this._returnSteps(value);
            return this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps) : returnSteps();
          }
          _nextSteps() {
            if (this._isFinished) {
              return Promise.resolve({ value: void 0, done: true });
            }
            const reader = this._reader;
            if (reader._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("iterate"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readRequest = {
              _chunkSteps: (chunk) => {
                this._ongoingPromise = void 0;
                queueMicrotask(() => resolvePromise({ value: chunk, done: false }));
              },
              _closeSteps: () => {
                this._ongoingPromise = void 0;
                this._isFinished = true;
                ReadableStreamReaderGenericRelease(reader);
                resolvePromise({ value: void 0, done: true });
              },
              _errorSteps: (reason) => {
                this._ongoingPromise = void 0;
                this._isFinished = true;
                ReadableStreamReaderGenericRelease(reader);
                rejectPromise(reason);
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promise;
          }
          _returnSteps(value) {
            if (this._isFinished) {
              return Promise.resolve({ value, done: true });
            }
            this._isFinished = true;
            const reader = this._reader;
            if (reader._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("finish iterating"));
            }
            if (!this._preventCancel) {
              const result = ReadableStreamReaderGenericCancel(reader, value);
              ReadableStreamReaderGenericRelease(reader);
              return transformPromiseWith(result, () => ({ value, done: true }));
            }
            ReadableStreamReaderGenericRelease(reader);
            return promiseResolvedWith({ value, done: true });
          }
        }
        const ReadableStreamAsyncIteratorPrototype = {
          next() {
            if (!IsReadableStreamAsyncIterator(this)) {
              return promiseRejectedWith(streamAsyncIteratorBrandCheckException("next"));
            }
            return this._asyncIteratorImpl.next();
          },
          return(value) {
            if (!IsReadableStreamAsyncIterator(this)) {
              return promiseRejectedWith(streamAsyncIteratorBrandCheckException("return"));
            }
            return this._asyncIteratorImpl.return(value);
          }
        };
        if (AsyncIteratorPrototype !== void 0) {
          Object.setPrototypeOf(ReadableStreamAsyncIteratorPrototype, AsyncIteratorPrototype);
        }
        function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
          const reader = AcquireReadableStreamDefaultReader(stream);
          const impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel);
          const iterator = Object.create(ReadableStreamAsyncIteratorPrototype);
          iterator._asyncIteratorImpl = impl;
          return iterator;
        }
        function IsReadableStreamAsyncIterator(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_asyncIteratorImpl")) {
            return false;
          }
          try {
            return x._asyncIteratorImpl instanceof ReadableStreamAsyncIteratorImpl;
          } catch (_a) {
            return false;
          }
        }
        function streamAsyncIteratorBrandCheckException(name) {
          return new TypeError(`ReadableStreamAsyncIterator.${name} can only be used on a ReadableSteamAsyncIterator`);
        }
        const NumberIsNaN = Number.isNaN || function(x) {
          return x !== x;
        };
        function CreateArrayFromList(elements) {
          return elements.slice();
        }
        function CopyDataBlockBytes(dest, destOffset, src2, srcOffset, n) {
          new Uint8Array(dest).set(new Uint8Array(src2, srcOffset, n), destOffset);
        }
        function TransferArrayBuffer(O) {
          return O;
        }
        function IsDetachedBuffer(O) {
          return false;
        }
        function ArrayBufferSlice(buffer, begin, end) {
          if (buffer.slice) {
            return buffer.slice(begin, end);
          }
          const length = end - begin;
          const slice = new ArrayBuffer(length);
          CopyDataBlockBytes(slice, 0, buffer, begin, length);
          return slice;
        }
        function IsNonNegativeNumber(v) {
          if (typeof v !== "number") {
            return false;
          }
          if (NumberIsNaN(v)) {
            return false;
          }
          if (v < 0) {
            return false;
          }
          return true;
        }
        function CloneAsUint8Array(O) {
          const buffer = ArrayBufferSlice(O.buffer, O.byteOffset, O.byteOffset + O.byteLength);
          return new Uint8Array(buffer);
        }
        function DequeueValue(container) {
          const pair = container._queue.shift();
          container._queueTotalSize -= pair.size;
          if (container._queueTotalSize < 0) {
            container._queueTotalSize = 0;
          }
          return pair.value;
        }
        function EnqueueValueWithSize(container, value, size) {
          if (!IsNonNegativeNumber(size) || size === Infinity) {
            throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
          }
          container._queue.push({ value, size });
          container._queueTotalSize += size;
        }
        function PeekQueueValue(container) {
          const pair = container._queue.peek();
          return pair.value;
        }
        function ResetQueue(container) {
          container._queue = new SimpleQueue();
          container._queueTotalSize = 0;
        }
        class ReadableStreamBYOBRequest {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get view() {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("view");
            }
            return this._view;
          }
          respond(bytesWritten) {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("respond");
            }
            assertRequiredArgument(bytesWritten, 1, "respond");
            bytesWritten = convertUnsignedLongLongWithEnforceRange(bytesWritten, "First parameter");
            if (this._associatedReadableByteStreamController === void 0) {
              throw new TypeError("This BYOB request has been invalidated");
            }
            if (IsDetachedBuffer(this._view.buffer))
              ;
            ReadableByteStreamControllerRespond(this._associatedReadableByteStreamController, bytesWritten);
          }
          respondWithNewView(view) {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("respondWithNewView");
            }
            assertRequiredArgument(view, 1, "respondWithNewView");
            if (!ArrayBuffer.isView(view)) {
              throw new TypeError("You can only respond with array buffer views");
            }
            if (this._associatedReadableByteStreamController === void 0) {
              throw new TypeError("This BYOB request has been invalidated");
            }
            if (IsDetachedBuffer(view.buffer))
              ;
            ReadableByteStreamControllerRespondWithNewView(this._associatedReadableByteStreamController, view);
          }
        }
        Object.defineProperties(ReadableStreamBYOBRequest.prototype, {
          respond: { enumerable: true },
          respondWithNewView: { enumerable: true },
          view: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamBYOBRequest.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamBYOBRequest",
            configurable: true
          });
        }
        class ReadableByteStreamController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get byobRequest() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("byobRequest");
            }
            return ReadableByteStreamControllerGetBYOBRequest(this);
          }
          get desiredSize() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("desiredSize");
            }
            return ReadableByteStreamControllerGetDesiredSize(this);
          }
          close() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("close");
            }
            if (this._closeRequested) {
              throw new TypeError("The stream has already been closed; do not close it again!");
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== "readable") {
              throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be closed`);
            }
            ReadableByteStreamControllerClose(this);
          }
          enqueue(chunk) {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("enqueue");
            }
            assertRequiredArgument(chunk, 1, "enqueue");
            if (!ArrayBuffer.isView(chunk)) {
              throw new TypeError("chunk must be an array buffer view");
            }
            if (chunk.byteLength === 0) {
              throw new TypeError("chunk must have non-zero byteLength");
            }
            if (chunk.buffer.byteLength === 0) {
              throw new TypeError(`chunk's buffer must have non-zero byteLength`);
            }
            if (this._closeRequested) {
              throw new TypeError("stream is closed or draining");
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== "readable") {
              throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be enqueued to`);
            }
            ReadableByteStreamControllerEnqueue(this, chunk);
          }
          error(e = void 0) {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("error");
            }
            ReadableByteStreamControllerError(this, e);
          }
          [CancelSteps](reason) {
            ReadableByteStreamControllerClearPendingPullIntos(this);
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableByteStreamControllerClearAlgorithms(this);
            return result;
          }
          [PullSteps](readRequest) {
            const stream = this._controlledReadableByteStream;
            if (this._queueTotalSize > 0) {
              const entry = this._queue.shift();
              this._queueTotalSize -= entry.byteLength;
              ReadableByteStreamControllerHandleQueueDrain(this);
              const view = new Uint8Array(entry.buffer, entry.byteOffset, entry.byteLength);
              readRequest._chunkSteps(view);
              return;
            }
            const autoAllocateChunkSize = this._autoAllocateChunkSize;
            if (autoAllocateChunkSize !== void 0) {
              let buffer;
              try {
                buffer = new ArrayBuffer(autoAllocateChunkSize);
              } catch (bufferE) {
                readRequest._errorSteps(bufferE);
                return;
              }
              const pullIntoDescriptor = {
                buffer,
                bufferByteLength: autoAllocateChunkSize,
                byteOffset: 0,
                byteLength: autoAllocateChunkSize,
                bytesFilled: 0,
                elementSize: 1,
                viewConstructor: Uint8Array,
                readerType: "default"
              };
              this._pendingPullIntos.push(pullIntoDescriptor);
            }
            ReadableStreamAddReadRequest(stream, readRequest);
            ReadableByteStreamControllerCallPullIfNeeded(this);
          }
        }
        Object.defineProperties(ReadableByteStreamController.prototype, {
          close: { enumerable: true },
          enqueue: { enumerable: true },
          error: { enumerable: true },
          byobRequest: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableByteStreamController.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableByteStreamController",
            configurable: true
          });
        }
        function IsReadableByteStreamController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledReadableByteStream")) {
            return false;
          }
          return x instanceof ReadableByteStreamController;
        }
        function IsReadableStreamBYOBRequest(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_associatedReadableByteStreamController")) {
            return false;
          }
          return x instanceof ReadableStreamBYOBRequest;
        }
        function ReadableByteStreamControllerCallPullIfNeeded(controller) {
          const shouldPull = ReadableByteStreamControllerShouldCallPull(controller);
          if (!shouldPull) {
            return;
          }
          if (controller._pulling) {
            controller._pullAgain = true;
            return;
          }
          controller._pulling = true;
          const pullPromise = controller._pullAlgorithm();
          uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
              controller._pullAgain = false;
              ReadableByteStreamControllerCallPullIfNeeded(controller);
            }
          }, (e) => {
            ReadableByteStreamControllerError(controller, e);
          });
        }
        function ReadableByteStreamControllerClearPendingPullIntos(controller) {
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          controller._pendingPullIntos = new SimpleQueue();
        }
        function ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor) {
          let done = false;
          if (stream._state === "closed") {
            done = true;
          }
          const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
          if (pullIntoDescriptor.readerType === "default") {
            ReadableStreamFulfillReadRequest(stream, filledView, done);
          } else {
            ReadableStreamFulfillReadIntoRequest(stream, filledView, done);
          }
        }
        function ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor) {
          const bytesFilled = pullIntoDescriptor.bytesFilled;
          const elementSize = pullIntoDescriptor.elementSize;
          return new pullIntoDescriptor.viewConstructor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, bytesFilled / elementSize);
        }
        function ReadableByteStreamControllerEnqueueChunkToQueue(controller, buffer, byteOffset, byteLength) {
          controller._queue.push({ buffer, byteOffset, byteLength });
          controller._queueTotalSize += byteLength;
        }
        function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor) {
          const elementSize = pullIntoDescriptor.elementSize;
          const currentAlignedBytes = pullIntoDescriptor.bytesFilled - pullIntoDescriptor.bytesFilled % elementSize;
          const maxBytesToCopy = Math.min(controller._queueTotalSize, pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled);
          const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy;
          const maxAlignedBytes = maxBytesFilled - maxBytesFilled % elementSize;
          let totalBytesToCopyRemaining = maxBytesToCopy;
          let ready = false;
          if (maxAlignedBytes > currentAlignedBytes) {
            totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled;
            ready = true;
          }
          const queue = controller._queue;
          while (totalBytesToCopyRemaining > 0) {
            const headOfQueue = queue.peek();
            const bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength);
            const destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            CopyDataBlockBytes(pullIntoDescriptor.buffer, destStart, headOfQueue.buffer, headOfQueue.byteOffset, bytesToCopy);
            if (headOfQueue.byteLength === bytesToCopy) {
              queue.shift();
            } else {
              headOfQueue.byteOffset += bytesToCopy;
              headOfQueue.byteLength -= bytesToCopy;
            }
            controller._queueTotalSize -= bytesToCopy;
            ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesToCopy, pullIntoDescriptor);
            totalBytesToCopyRemaining -= bytesToCopy;
          }
          return ready;
        }
        function ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, size, pullIntoDescriptor) {
          pullIntoDescriptor.bytesFilled += size;
        }
        function ReadableByteStreamControllerHandleQueueDrain(controller) {
          if (controller._queueTotalSize === 0 && controller._closeRequested) {
            ReadableByteStreamControllerClearAlgorithms(controller);
            ReadableStreamClose(controller._controlledReadableByteStream);
          } else {
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }
        }
        function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
          if (controller._byobRequest === null) {
            return;
          }
          controller._byobRequest._associatedReadableByteStreamController = void 0;
          controller._byobRequest._view = null;
          controller._byobRequest = null;
        }
        function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller) {
          while (controller._pendingPullIntos.length > 0) {
            if (controller._queueTotalSize === 0) {
              return;
            }
            const pullIntoDescriptor = controller._pendingPullIntos.peek();
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
              ReadableByteStreamControllerShiftPendingPullInto(controller);
              ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
            }
          }
        }
        function ReadableByteStreamControllerPullInto(controller, view, readIntoRequest) {
          const stream = controller._controlledReadableByteStream;
          let elementSize = 1;
          if (view.constructor !== DataView) {
            elementSize = view.constructor.BYTES_PER_ELEMENT;
          }
          const ctor = view.constructor;
          const buffer = TransferArrayBuffer(view.buffer);
          const pullIntoDescriptor = {
            buffer,
            bufferByteLength: buffer.byteLength,
            byteOffset: view.byteOffset,
            byteLength: view.byteLength,
            bytesFilled: 0,
            elementSize,
            viewConstructor: ctor,
            readerType: "byob"
          };
          if (controller._pendingPullIntos.length > 0) {
            controller._pendingPullIntos.push(pullIntoDescriptor);
            ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
            return;
          }
          if (stream._state === "closed") {
            const emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0);
            readIntoRequest._closeSteps(emptyView);
            return;
          }
          if (controller._queueTotalSize > 0) {
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
              const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
              ReadableByteStreamControllerHandleQueueDrain(controller);
              readIntoRequest._chunkSteps(filledView);
              return;
            }
            if (controller._closeRequested) {
              const e = new TypeError("Insufficient bytes to fill elements in the given buffer");
              ReadableByteStreamControllerError(controller, e);
              readIntoRequest._errorSteps(e);
              return;
            }
          }
          controller._pendingPullIntos.push(pullIntoDescriptor);
          ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor) {
          const stream = controller._controlledReadableByteStream;
          if (ReadableStreamHasBYOBReader(stream)) {
            while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
              const pullIntoDescriptor = ReadableByteStreamControllerShiftPendingPullInto(controller);
              ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor);
            }
          }
        }
        function ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, pullIntoDescriptor) {
          ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesWritten, pullIntoDescriptor);
          if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize) {
            return;
          }
          ReadableByteStreamControllerShiftPendingPullInto(controller);
          const remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize;
          if (remainderSize > 0) {
            const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            const remainder = ArrayBufferSlice(pullIntoDescriptor.buffer, end - remainderSize, end);
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, remainder, 0, remainder.byteLength);
          }
          pullIntoDescriptor.bytesFilled -= remainderSize;
          ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
          ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
        }
        function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            ReadableByteStreamControllerRespondInClosedState(controller);
          } else {
            ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, firstDescriptor);
          }
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerShiftPendingPullInto(controller) {
          const descriptor = controller._pendingPullIntos.shift();
          return descriptor;
        }
        function ReadableByteStreamControllerShouldCallPull(controller) {
          const stream = controller._controlledReadableByteStream;
          if (stream._state !== "readable") {
            return false;
          }
          if (controller._closeRequested) {
            return false;
          }
          if (!controller._started) {
            return false;
          }
          if (ReadableStreamHasDefaultReader(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
          }
          if (ReadableStreamHasBYOBReader(stream) && ReadableStreamGetNumReadIntoRequests(stream) > 0) {
            return true;
          }
          const desiredSize = ReadableByteStreamControllerGetDesiredSize(controller);
          if (desiredSize > 0) {
            return true;
          }
          return false;
        }
        function ReadableByteStreamControllerClearAlgorithms(controller) {
          controller._pullAlgorithm = void 0;
          controller._cancelAlgorithm = void 0;
        }
        function ReadableByteStreamControllerClose(controller) {
          const stream = controller._controlledReadableByteStream;
          if (controller._closeRequested || stream._state !== "readable") {
            return;
          }
          if (controller._queueTotalSize > 0) {
            controller._closeRequested = true;
            return;
          }
          if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (firstPendingPullInto.bytesFilled > 0) {
              const e = new TypeError("Insufficient bytes to fill elements in the given buffer");
              ReadableByteStreamControllerError(controller, e);
              throw e;
            }
          }
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamClose(stream);
        }
        function ReadableByteStreamControllerEnqueue(controller, chunk) {
          const stream = controller._controlledReadableByteStream;
          if (controller._closeRequested || stream._state !== "readable") {
            return;
          }
          const buffer = chunk.buffer;
          const byteOffset = chunk.byteOffset;
          const byteLength = chunk.byteLength;
          const transferredBuffer = TransferArrayBuffer(buffer);
          if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (IsDetachedBuffer(firstPendingPullInto.buffer))
              ;
            firstPendingPullInto.buffer = TransferArrayBuffer(firstPendingPullInto.buffer);
          }
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          if (ReadableStreamHasDefaultReader(stream)) {
            if (ReadableStreamGetNumReadRequests(stream) === 0) {
              ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            } else {
              const transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength);
              ReadableStreamFulfillReadRequest(stream, transferredView, false);
            }
          } else if (ReadableStreamHasBYOBReader(stream)) {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
          } else {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
          }
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerError(controller, e) {
          const stream = controller._controlledReadableByteStream;
          if (stream._state !== "readable") {
            return;
          }
          ReadableByteStreamControllerClearPendingPullIntos(controller);
          ResetQueue(controller);
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamError(stream, e);
        }
        function ReadableByteStreamControllerGetBYOBRequest(controller) {
          if (controller._byobRequest === null && controller._pendingPullIntos.length > 0) {
            const firstDescriptor = controller._pendingPullIntos.peek();
            const view = new Uint8Array(firstDescriptor.buffer, firstDescriptor.byteOffset + firstDescriptor.bytesFilled, firstDescriptor.byteLength - firstDescriptor.bytesFilled);
            const byobRequest = Object.create(ReadableStreamBYOBRequest.prototype);
            SetUpReadableStreamBYOBRequest(byobRequest, controller, view);
            controller._byobRequest = byobRequest;
          }
          return controller._byobRequest;
        }
        function ReadableByteStreamControllerGetDesiredSize(controller) {
          const state = controller._controlledReadableByteStream._state;
          if (state === "errored") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function ReadableByteStreamControllerRespond(controller, bytesWritten) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            if (bytesWritten !== 0) {
              throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
            }
          } else {
            if (bytesWritten === 0) {
              throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
            }
            if (firstDescriptor.bytesFilled + bytesWritten > firstDescriptor.byteLength) {
              throw new RangeError("bytesWritten out of range");
            }
          }
          firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer);
          ReadableByteStreamControllerRespondInternal(controller, bytesWritten);
        }
        function ReadableByteStreamControllerRespondWithNewView(controller, view) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            if (view.byteLength !== 0) {
              throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
            }
          } else {
            if (view.byteLength === 0) {
              throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
            }
          }
          if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
            throw new RangeError("The region specified by view does not match byobRequest");
          }
          if (firstDescriptor.bufferByteLength !== view.buffer.byteLength) {
            throw new RangeError("The buffer of view has different capacity than byobRequest");
          }
          if (firstDescriptor.bytesFilled + view.byteLength > firstDescriptor.byteLength) {
            throw new RangeError("The region specified by view is larger than byobRequest");
          }
          firstDescriptor.buffer = TransferArrayBuffer(view.buffer);
          ReadableByteStreamControllerRespondInternal(controller, view.byteLength);
        }
        function SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize) {
          controller._controlledReadableByteStream = stream;
          controller._pullAgain = false;
          controller._pulling = false;
          controller._byobRequest = null;
          controller._queue = controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._closeRequested = false;
          controller._started = false;
          controller._strategyHWM = highWaterMark;
          controller._pullAlgorithm = pullAlgorithm;
          controller._cancelAlgorithm = cancelAlgorithm;
          controller._autoAllocateChunkSize = autoAllocateChunkSize;
          controller._pendingPullIntos = new SimpleQueue();
          stream._readableStreamController = controller;
          const startResult = startAlgorithm();
          uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }, (r) => {
            ReadableByteStreamControllerError(controller, r);
          });
        }
        function SetUpReadableByteStreamControllerFromUnderlyingSource(stream, underlyingByteSource, highWaterMark) {
          const controller = Object.create(ReadableByteStreamController.prototype);
          let startAlgorithm = () => void 0;
          let pullAlgorithm = () => promiseResolvedWith(void 0);
          let cancelAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingByteSource.start !== void 0) {
            startAlgorithm = () => underlyingByteSource.start(controller);
          }
          if (underlyingByteSource.pull !== void 0) {
            pullAlgorithm = () => underlyingByteSource.pull(controller);
          }
          if (underlyingByteSource.cancel !== void 0) {
            cancelAlgorithm = (reason) => underlyingByteSource.cancel(reason);
          }
          const autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize;
          if (autoAllocateChunkSize === 0) {
            throw new TypeError("autoAllocateChunkSize must be greater than 0");
          }
          SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize);
        }
        function SetUpReadableStreamBYOBRequest(request, controller, view) {
          request._associatedReadableByteStreamController = controller;
          request._view = view;
        }
        function byobRequestBrandCheckException(name) {
          return new TypeError(`ReadableStreamBYOBRequest.prototype.${name} can only be used on a ReadableStreamBYOBRequest`);
        }
        function byteStreamControllerBrandCheckException(name) {
          return new TypeError(`ReadableByteStreamController.prototype.${name} can only be used on a ReadableByteStreamController`);
        }
        function AcquireReadableStreamBYOBReader(stream) {
          return new ReadableStreamBYOBReader(stream);
        }
        function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
          stream._reader._readIntoRequests.push(readIntoRequest);
        }
        function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
          const reader = stream._reader;
          const readIntoRequest = reader._readIntoRequests.shift();
          if (done) {
            readIntoRequest._closeSteps(chunk);
          } else {
            readIntoRequest._chunkSteps(chunk);
          }
        }
        function ReadableStreamGetNumReadIntoRequests(stream) {
          return stream._reader._readIntoRequests.length;
        }
        function ReadableStreamHasBYOBReader(stream) {
          const reader = stream._reader;
          if (reader === void 0) {
            return false;
          }
          if (!IsReadableStreamBYOBReader(reader)) {
            return false;
          }
          return true;
        }
        class ReadableStreamBYOBReader {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "ReadableStreamBYOBReader");
            assertReadableStream(stream, "First parameter");
            if (IsReadableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive reading by another reader");
            }
            if (!IsReadableByteStreamController(stream._readableStreamController)) {
              throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readIntoRequests = new SimpleQueue();
          }
          get closed() {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          cancel(reason = void 0) {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("cancel"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("cancel"));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
          }
          read(view) {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("read"));
            }
            if (!ArrayBuffer.isView(view)) {
              return promiseRejectedWith(new TypeError("view must be an array buffer view"));
            }
            if (view.byteLength === 0) {
              return promiseRejectedWith(new TypeError("view must have non-zero byteLength"));
            }
            if (view.buffer.byteLength === 0) {
              return promiseRejectedWith(new TypeError(`view's buffer must have non-zero byteLength`));
            }
            if (IsDetachedBuffer(view.buffer))
              ;
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("read from"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readIntoRequest = {
              _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
              _closeSteps: (chunk) => resolvePromise({ value: chunk, done: true }),
              _errorSteps: (e) => rejectPromise(e)
            };
            ReadableStreamBYOBReaderRead(this, view, readIntoRequest);
            return promise;
          }
          releaseLock() {
            if (!IsReadableStreamBYOBReader(this)) {
              throw byobReaderBrandCheckException("releaseLock");
            }
            if (this._ownerReadableStream === void 0) {
              return;
            }
            if (this._readIntoRequests.length > 0) {
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            }
            ReadableStreamReaderGenericRelease(this);
          }
        }
        Object.defineProperties(ReadableStreamBYOBReader.prototype, {
          cancel: { enumerable: true },
          read: { enumerable: true },
          releaseLock: { enumerable: true },
          closed: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamBYOBReader.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamBYOBReader",
            configurable: true
          });
        }
        function IsReadableStreamBYOBReader(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readIntoRequests")) {
            return false;
          }
          return x instanceof ReadableStreamBYOBReader;
        }
        function ReadableStreamBYOBReaderRead(reader, view, readIntoRequest) {
          const stream = reader._ownerReadableStream;
          stream._disturbed = true;
          if (stream._state === "errored") {
            readIntoRequest._errorSteps(stream._storedError);
          } else {
            ReadableByteStreamControllerPullInto(stream._readableStreamController, view, readIntoRequest);
          }
        }
        function byobReaderBrandCheckException(name) {
          return new TypeError(`ReadableStreamBYOBReader.prototype.${name} can only be used on a ReadableStreamBYOBReader`);
        }
        function ExtractHighWaterMark(strategy, defaultHWM) {
          const { highWaterMark } = strategy;
          if (highWaterMark === void 0) {
            return defaultHWM;
          }
          if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
            throw new RangeError("Invalid highWaterMark");
          }
          return highWaterMark;
        }
        function ExtractSizeAlgorithm(strategy) {
          const { size } = strategy;
          if (!size) {
            return () => 1;
          }
          return size;
        }
        function convertQueuingStrategy(init2, context) {
          assertDictionary(init2, context);
          const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
          const size = init2 === null || init2 === void 0 ? void 0 : init2.size;
          return {
            highWaterMark: highWaterMark === void 0 ? void 0 : convertUnrestrictedDouble(highWaterMark),
            size: size === void 0 ? void 0 : convertQueuingStrategySize(size, `${context} has member 'size' that`)
          };
        }
        function convertQueuingStrategySize(fn, context) {
          assertFunction(fn, context);
          return (chunk) => convertUnrestrictedDouble(fn(chunk));
        }
        function convertUnderlyingSink(original, context) {
          assertDictionary(original, context);
          const abort = original === null || original === void 0 ? void 0 : original.abort;
          const close = original === null || original === void 0 ? void 0 : original.close;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const type = original === null || original === void 0 ? void 0 : original.type;
          const write = original === null || original === void 0 ? void 0 : original.write;
          return {
            abort: abort === void 0 ? void 0 : convertUnderlyingSinkAbortCallback(abort, original, `${context} has member 'abort' that`),
            close: close === void 0 ? void 0 : convertUnderlyingSinkCloseCallback(close, original, `${context} has member 'close' that`),
            start: start === void 0 ? void 0 : convertUnderlyingSinkStartCallback(start, original, `${context} has member 'start' that`),
            write: write === void 0 ? void 0 : convertUnderlyingSinkWriteCallback(write, original, `${context} has member 'write' that`),
            type
          };
        }
        function convertUnderlyingSinkAbortCallback(fn, original, context) {
          assertFunction(fn, context);
          return (reason) => promiseCall(fn, original, [reason]);
        }
        function convertUnderlyingSinkCloseCallback(fn, original, context) {
          assertFunction(fn, context);
          return () => promiseCall(fn, original, []);
        }
        function convertUnderlyingSinkStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertUnderlyingSinkWriteCallback(fn, original, context) {
          assertFunction(fn, context);
          return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
        }
        function assertWritableStream(x, context) {
          if (!IsWritableStream(x)) {
            throw new TypeError(`${context} is not a WritableStream.`);
          }
        }
        function isAbortSignal2(value) {
          if (typeof value !== "object" || value === null) {
            return false;
          }
          try {
            return typeof value.aborted === "boolean";
          } catch (_a) {
            return false;
          }
        }
        const supportsAbortController = typeof AbortController === "function";
        function createAbortController() {
          if (supportsAbortController) {
            return new AbortController();
          }
          return void 0;
        }
        class WritableStream {
          constructor(rawUnderlyingSink = {}, rawStrategy = {}) {
            if (rawUnderlyingSink === void 0) {
              rawUnderlyingSink = null;
            } else {
              assertObject(rawUnderlyingSink, "First parameter");
            }
            const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
            const underlyingSink = convertUnderlyingSink(rawUnderlyingSink, "First parameter");
            InitializeWritableStream(this);
            const type = underlyingSink.type;
            if (type !== void 0) {
              throw new RangeError("Invalid type is specified");
            }
            const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
            const highWaterMark = ExtractHighWaterMark(strategy, 1);
            SetUpWritableStreamDefaultControllerFromUnderlyingSink(this, underlyingSink, highWaterMark, sizeAlgorithm);
          }
          get locked() {
            if (!IsWritableStream(this)) {
              throw streamBrandCheckException$2("locked");
            }
            return IsWritableStreamLocked(this);
          }
          abort(reason = void 0) {
            if (!IsWritableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$2("abort"));
            }
            if (IsWritableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot abort a stream that already has a writer"));
            }
            return WritableStreamAbort(this, reason);
          }
          close() {
            if (!IsWritableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$2("close"));
            }
            if (IsWritableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot close a stream that already has a writer"));
            }
            if (WritableStreamCloseQueuedOrInFlight(this)) {
              return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
            }
            return WritableStreamClose(this);
          }
          getWriter() {
            if (!IsWritableStream(this)) {
              throw streamBrandCheckException$2("getWriter");
            }
            return AcquireWritableStreamDefaultWriter(this);
          }
        }
        Object.defineProperties(WritableStream.prototype, {
          abort: { enumerable: true },
          close: { enumerable: true },
          getWriter: { enumerable: true },
          locked: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStream.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStream",
            configurable: true
          });
        }
        function AcquireWritableStreamDefaultWriter(stream) {
          return new WritableStreamDefaultWriter(stream);
        }
        function CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
          const stream = Object.create(WritableStream.prototype);
          InitializeWritableStream(stream);
          const controller = Object.create(WritableStreamDefaultController.prototype);
          SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
          return stream;
        }
        function InitializeWritableStream(stream) {
          stream._state = "writable";
          stream._storedError = void 0;
          stream._writer = void 0;
          stream._writableStreamController = void 0;
          stream._writeRequests = new SimpleQueue();
          stream._inFlightWriteRequest = void 0;
          stream._closeRequest = void 0;
          stream._inFlightCloseRequest = void 0;
          stream._pendingAbortRequest = void 0;
          stream._backpressure = false;
        }
        function IsWritableStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_writableStreamController")) {
            return false;
          }
          return x instanceof WritableStream;
        }
        function IsWritableStreamLocked(stream) {
          if (stream._writer === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamAbort(stream, reason) {
          var _a;
          if (stream._state === "closed" || stream._state === "errored") {
            return promiseResolvedWith(void 0);
          }
          stream._writableStreamController._abortReason = reason;
          (_a = stream._writableStreamController._abortController) === null || _a === void 0 ? void 0 : _a.abort();
          const state = stream._state;
          if (state === "closed" || state === "errored") {
            return promiseResolvedWith(void 0);
          }
          if (stream._pendingAbortRequest !== void 0) {
            return stream._pendingAbortRequest._promise;
          }
          let wasAlreadyErroring = false;
          if (state === "erroring") {
            wasAlreadyErroring = true;
            reason = void 0;
          }
          const promise = newPromise((resolve2, reject) => {
            stream._pendingAbortRequest = {
              _promise: void 0,
              _resolve: resolve2,
              _reject: reject,
              _reason: reason,
              _wasAlreadyErroring: wasAlreadyErroring
            };
          });
          stream._pendingAbortRequest._promise = promise;
          if (!wasAlreadyErroring) {
            WritableStreamStartErroring(stream, reason);
          }
          return promise;
        }
        function WritableStreamClose(stream) {
          const state = stream._state;
          if (state === "closed" || state === "errored") {
            return promiseRejectedWith(new TypeError(`The stream (in ${state} state) is not in the writable state and cannot be closed`));
          }
          const promise = newPromise((resolve2, reject) => {
            const closeRequest = {
              _resolve: resolve2,
              _reject: reject
            };
            stream._closeRequest = closeRequest;
          });
          const writer = stream._writer;
          if (writer !== void 0 && stream._backpressure && state === "writable") {
            defaultWriterReadyPromiseResolve(writer);
          }
          WritableStreamDefaultControllerClose(stream._writableStreamController);
          return promise;
        }
        function WritableStreamAddWriteRequest(stream) {
          const promise = newPromise((resolve2, reject) => {
            const writeRequest = {
              _resolve: resolve2,
              _reject: reject
            };
            stream._writeRequests.push(writeRequest);
          });
          return promise;
        }
        function WritableStreamDealWithRejection(stream, error2) {
          const state = stream._state;
          if (state === "writable") {
            WritableStreamStartErroring(stream, error2);
            return;
          }
          WritableStreamFinishErroring(stream);
        }
        function WritableStreamStartErroring(stream, reason) {
          const controller = stream._writableStreamController;
          stream._state = "erroring";
          stream._storedError = reason;
          const writer = stream._writer;
          if (writer !== void 0) {
            WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason);
          }
          if (!WritableStreamHasOperationMarkedInFlight(stream) && controller._started) {
            WritableStreamFinishErroring(stream);
          }
        }
        function WritableStreamFinishErroring(stream) {
          stream._state = "errored";
          stream._writableStreamController[ErrorSteps]();
          const storedError = stream._storedError;
          stream._writeRequests.forEach((writeRequest) => {
            writeRequest._reject(storedError);
          });
          stream._writeRequests = new SimpleQueue();
          if (stream._pendingAbortRequest === void 0) {
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
          }
          const abortRequest = stream._pendingAbortRequest;
          stream._pendingAbortRequest = void 0;
          if (abortRequest._wasAlreadyErroring) {
            abortRequest._reject(storedError);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
          }
          const promise = stream._writableStreamController[AbortSteps](abortRequest._reason);
          uponPromise(promise, () => {
            abortRequest._resolve();
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          }, (reason) => {
            abortRequest._reject(reason);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          });
        }
        function WritableStreamFinishInFlightWrite(stream) {
          stream._inFlightWriteRequest._resolve(void 0);
          stream._inFlightWriteRequest = void 0;
        }
        function WritableStreamFinishInFlightWriteWithError(stream, error2) {
          stream._inFlightWriteRequest._reject(error2);
          stream._inFlightWriteRequest = void 0;
          WritableStreamDealWithRejection(stream, error2);
        }
        function WritableStreamFinishInFlightClose(stream) {
          stream._inFlightCloseRequest._resolve(void 0);
          stream._inFlightCloseRequest = void 0;
          const state = stream._state;
          if (state === "erroring") {
            stream._storedError = void 0;
            if (stream._pendingAbortRequest !== void 0) {
              stream._pendingAbortRequest._resolve();
              stream._pendingAbortRequest = void 0;
            }
          }
          stream._state = "closed";
          const writer = stream._writer;
          if (writer !== void 0) {
            defaultWriterClosedPromiseResolve(writer);
          }
        }
        function WritableStreamFinishInFlightCloseWithError(stream, error2) {
          stream._inFlightCloseRequest._reject(error2);
          stream._inFlightCloseRequest = void 0;
          if (stream._pendingAbortRequest !== void 0) {
            stream._pendingAbortRequest._reject(error2);
            stream._pendingAbortRequest = void 0;
          }
          WritableStreamDealWithRejection(stream, error2);
        }
        function WritableStreamCloseQueuedOrInFlight(stream) {
          if (stream._closeRequest === void 0 && stream._inFlightCloseRequest === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamHasOperationMarkedInFlight(stream) {
          if (stream._inFlightWriteRequest === void 0 && stream._inFlightCloseRequest === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamMarkCloseRequestInFlight(stream) {
          stream._inFlightCloseRequest = stream._closeRequest;
          stream._closeRequest = void 0;
        }
        function WritableStreamMarkFirstWriteRequestInFlight(stream) {
          stream._inFlightWriteRequest = stream._writeRequests.shift();
        }
        function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
          if (stream._closeRequest !== void 0) {
            stream._closeRequest._reject(stream._storedError);
            stream._closeRequest = void 0;
          }
          const writer = stream._writer;
          if (writer !== void 0) {
            defaultWriterClosedPromiseReject(writer, stream._storedError);
          }
        }
        function WritableStreamUpdateBackpressure(stream, backpressure) {
          const writer = stream._writer;
          if (writer !== void 0 && backpressure !== stream._backpressure) {
            if (backpressure) {
              defaultWriterReadyPromiseReset(writer);
            } else {
              defaultWriterReadyPromiseResolve(writer);
            }
          }
          stream._backpressure = backpressure;
        }
        class WritableStreamDefaultWriter {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "WritableStreamDefaultWriter");
            assertWritableStream(stream, "First parameter");
            if (IsWritableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive writing by another writer");
            }
            this._ownerWritableStream = stream;
            stream._writer = this;
            const state = stream._state;
            if (state === "writable") {
              if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._backpressure) {
                defaultWriterReadyPromiseInitialize(this);
              } else {
                defaultWriterReadyPromiseInitializeAsResolved(this);
              }
              defaultWriterClosedPromiseInitialize(this);
            } else if (state === "erroring") {
              defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError);
              defaultWriterClosedPromiseInitialize(this);
            } else if (state === "closed") {
              defaultWriterReadyPromiseInitializeAsResolved(this);
              defaultWriterClosedPromiseInitializeAsResolved(this);
            } else {
              const storedError = stream._storedError;
              defaultWriterReadyPromiseInitializeAsRejected(this, storedError);
              defaultWriterClosedPromiseInitializeAsRejected(this, storedError);
            }
          }
          get closed() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          get desiredSize() {
            if (!IsWritableStreamDefaultWriter(this)) {
              throw defaultWriterBrandCheckException("desiredSize");
            }
            if (this._ownerWritableStream === void 0) {
              throw defaultWriterLockException("desiredSize");
            }
            return WritableStreamDefaultWriterGetDesiredSize(this);
          }
          get ready() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("ready"));
            }
            return this._readyPromise;
          }
          abort(reason = void 0) {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("abort"));
            }
            if (this._ownerWritableStream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("abort"));
            }
            return WritableStreamDefaultWriterAbort(this, reason);
          }
          close() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("close"));
            }
            const stream = this._ownerWritableStream;
            if (stream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("close"));
            }
            if (WritableStreamCloseQueuedOrInFlight(stream)) {
              return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
            }
            return WritableStreamDefaultWriterClose(this);
          }
          releaseLock() {
            if (!IsWritableStreamDefaultWriter(this)) {
              throw defaultWriterBrandCheckException("releaseLock");
            }
            const stream = this._ownerWritableStream;
            if (stream === void 0) {
              return;
            }
            WritableStreamDefaultWriterRelease(this);
          }
          write(chunk = void 0) {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("write"));
            }
            if (this._ownerWritableStream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("write to"));
            }
            return WritableStreamDefaultWriterWrite(this, chunk);
          }
        }
        Object.defineProperties(WritableStreamDefaultWriter.prototype, {
          abort: { enumerable: true },
          close: { enumerable: true },
          releaseLock: { enumerable: true },
          write: { enumerable: true },
          closed: { enumerable: true },
          desiredSize: { enumerable: true },
          ready: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStreamDefaultWriter.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStreamDefaultWriter",
            configurable: true
          });
        }
        function IsWritableStreamDefaultWriter(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_ownerWritableStream")) {
            return false;
          }
          return x instanceof WritableStreamDefaultWriter;
        }
        function WritableStreamDefaultWriterAbort(writer, reason) {
          const stream = writer._ownerWritableStream;
          return WritableStreamAbort(stream, reason);
        }
        function WritableStreamDefaultWriterClose(writer) {
          const stream = writer._ownerWritableStream;
          return WritableStreamClose(stream);
        }
        function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
          const stream = writer._ownerWritableStream;
          const state = stream._state;
          if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
            return promiseResolvedWith(void 0);
          }
          if (state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          return WritableStreamDefaultWriterClose(writer);
        }
        function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error2) {
          if (writer._closedPromiseState === "pending") {
            defaultWriterClosedPromiseReject(writer, error2);
          } else {
            defaultWriterClosedPromiseResetToRejected(writer, error2);
          }
        }
        function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error2) {
          if (writer._readyPromiseState === "pending") {
            defaultWriterReadyPromiseReject(writer, error2);
          } else {
            defaultWriterReadyPromiseResetToRejected(writer, error2);
          }
        }
        function WritableStreamDefaultWriterGetDesiredSize(writer) {
          const stream = writer._ownerWritableStream;
          const state = stream._state;
          if (state === "errored" || state === "erroring") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return WritableStreamDefaultControllerGetDesiredSize(stream._writableStreamController);
        }
        function WritableStreamDefaultWriterRelease(writer) {
          const stream = writer._ownerWritableStream;
          const releasedError = new TypeError(`Writer was released and can no longer be used to monitor the stream's closedness`);
          WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError);
          WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError);
          stream._writer = void 0;
          writer._ownerWritableStream = void 0;
        }
        function WritableStreamDefaultWriterWrite(writer, chunk) {
          const stream = writer._ownerWritableStream;
          const controller = stream._writableStreamController;
          const chunkSize = WritableStreamDefaultControllerGetChunkSize(controller, chunk);
          if (stream !== writer._ownerWritableStream) {
            return promiseRejectedWith(defaultWriterLockException("write to"));
          }
          const state = stream._state;
          if (state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
            return promiseRejectedWith(new TypeError("The stream is closing or closed and cannot be written to"));
          }
          if (state === "erroring") {
            return promiseRejectedWith(stream._storedError);
          }
          const promise = WritableStreamAddWriteRequest(stream);
          WritableStreamDefaultControllerWrite(controller, chunk, chunkSize);
          return promise;
        }
        const closeSentinel = {};
        class WritableStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get abortReason() {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("abortReason");
            }
            return this._abortReason;
          }
          get signal() {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("signal");
            }
            if (this._abortController === void 0) {
              throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
            }
            return this._abortController.signal;
          }
          error(e = void 0) {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("error");
            }
            const state = this._controlledWritableStream._state;
            if (state !== "writable") {
              return;
            }
            WritableStreamDefaultControllerError(this, e);
          }
          [AbortSteps](reason) {
            const result = this._abortAlgorithm(reason);
            WritableStreamDefaultControllerClearAlgorithms(this);
            return result;
          }
          [ErrorSteps]() {
            ResetQueue(this);
          }
        }
        Object.defineProperties(WritableStreamDefaultController.prototype, {
          error: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStreamDefaultController",
            configurable: true
          });
        }
        function IsWritableStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledWritableStream")) {
            return false;
          }
          return x instanceof WritableStreamDefaultController;
        }
        function SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm) {
          controller._controlledWritableStream = stream;
          stream._writableStreamController = controller;
          controller._queue = void 0;
          controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._abortReason = void 0;
          controller._abortController = createAbortController();
          controller._started = false;
          controller._strategySizeAlgorithm = sizeAlgorithm;
          controller._strategyHWM = highWaterMark;
          controller._writeAlgorithm = writeAlgorithm;
          controller._closeAlgorithm = closeAlgorithm;
          controller._abortAlgorithm = abortAlgorithm;
          const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
          WritableStreamUpdateBackpressure(stream, backpressure);
          const startResult = startAlgorithm();
          const startPromise = promiseResolvedWith(startResult);
          uponPromise(startPromise, () => {
            controller._started = true;
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          }, (r) => {
            controller._started = true;
            WritableStreamDealWithRejection(stream, r);
          });
        }
        function SetUpWritableStreamDefaultControllerFromUnderlyingSink(stream, underlyingSink, highWaterMark, sizeAlgorithm) {
          const controller = Object.create(WritableStreamDefaultController.prototype);
          let startAlgorithm = () => void 0;
          let writeAlgorithm = () => promiseResolvedWith(void 0);
          let closeAlgorithm = () => promiseResolvedWith(void 0);
          let abortAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingSink.start !== void 0) {
            startAlgorithm = () => underlyingSink.start(controller);
          }
          if (underlyingSink.write !== void 0) {
            writeAlgorithm = (chunk) => underlyingSink.write(chunk, controller);
          }
          if (underlyingSink.close !== void 0) {
            closeAlgorithm = () => underlyingSink.close();
          }
          if (underlyingSink.abort !== void 0) {
            abortAlgorithm = (reason) => underlyingSink.abort(reason);
          }
          SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
        }
        function WritableStreamDefaultControllerClearAlgorithms(controller) {
          controller._writeAlgorithm = void 0;
          controller._closeAlgorithm = void 0;
          controller._abortAlgorithm = void 0;
          controller._strategySizeAlgorithm = void 0;
        }
        function WritableStreamDefaultControllerClose(controller) {
          EnqueueValueWithSize(controller, closeSentinel, 0);
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }
        function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
          try {
            return controller._strategySizeAlgorithm(chunk);
          } catch (chunkSizeE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE);
            return 1;
          }
        }
        function WritableStreamDefaultControllerGetDesiredSize(controller) {
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
          try {
            EnqueueValueWithSize(controller, chunk, chunkSize);
          } catch (enqueueE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE);
            return;
          }
          const stream = controller._controlledWritableStream;
          if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._state === "writable") {
            const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
            WritableStreamUpdateBackpressure(stream, backpressure);
          }
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }
        function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
          const stream = controller._controlledWritableStream;
          if (!controller._started) {
            return;
          }
          if (stream._inFlightWriteRequest !== void 0) {
            return;
          }
          const state = stream._state;
          if (state === "erroring") {
            WritableStreamFinishErroring(stream);
            return;
          }
          if (controller._queue.length === 0) {
            return;
          }
          const value = PeekQueueValue(controller);
          if (value === closeSentinel) {
            WritableStreamDefaultControllerProcessClose(controller);
          } else {
            WritableStreamDefaultControllerProcessWrite(controller, value);
          }
        }
        function WritableStreamDefaultControllerErrorIfNeeded(controller, error2) {
          if (controller._controlledWritableStream._state === "writable") {
            WritableStreamDefaultControllerError(controller, error2);
          }
        }
        function WritableStreamDefaultControllerProcessClose(controller) {
          const stream = controller._controlledWritableStream;
          WritableStreamMarkCloseRequestInFlight(stream);
          DequeueValue(controller);
          const sinkClosePromise = controller._closeAlgorithm();
          WritableStreamDefaultControllerClearAlgorithms(controller);
          uponPromise(sinkClosePromise, () => {
            WritableStreamFinishInFlightClose(stream);
          }, (reason) => {
            WritableStreamFinishInFlightCloseWithError(stream, reason);
          });
        }
        function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
          const stream = controller._controlledWritableStream;
          WritableStreamMarkFirstWriteRequestInFlight(stream);
          const sinkWritePromise = controller._writeAlgorithm(chunk);
          uponPromise(sinkWritePromise, () => {
            WritableStreamFinishInFlightWrite(stream);
            const state = stream._state;
            DequeueValue(controller);
            if (!WritableStreamCloseQueuedOrInFlight(stream) && state === "writable") {
              const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
              WritableStreamUpdateBackpressure(stream, backpressure);
            }
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          }, (reason) => {
            if (stream._state === "writable") {
              WritableStreamDefaultControllerClearAlgorithms(controller);
            }
            WritableStreamFinishInFlightWriteWithError(stream, reason);
          });
        }
        function WritableStreamDefaultControllerGetBackpressure(controller) {
          const desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller);
          return desiredSize <= 0;
        }
        function WritableStreamDefaultControllerError(controller, error2) {
          const stream = controller._controlledWritableStream;
          WritableStreamDefaultControllerClearAlgorithms(controller);
          WritableStreamStartErroring(stream, error2);
        }
        function streamBrandCheckException$2(name) {
          return new TypeError(`WritableStream.prototype.${name} can only be used on a WritableStream`);
        }
        function defaultControllerBrandCheckException$2(name) {
          return new TypeError(`WritableStreamDefaultController.prototype.${name} can only be used on a WritableStreamDefaultController`);
        }
        function defaultWriterBrandCheckException(name) {
          return new TypeError(`WritableStreamDefaultWriter.prototype.${name} can only be used on a WritableStreamDefaultWriter`);
        }
        function defaultWriterLockException(name) {
          return new TypeError("Cannot " + name + " a stream using a released writer");
        }
        function defaultWriterClosedPromiseInitialize(writer) {
          writer._closedPromise = newPromise((resolve2, reject) => {
            writer._closedPromise_resolve = resolve2;
            writer._closedPromise_reject = reject;
            writer._closedPromiseState = "pending";
          });
        }
        function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
          defaultWriterClosedPromiseInitialize(writer);
          defaultWriterClosedPromiseReject(writer, reason);
        }
        function defaultWriterClosedPromiseInitializeAsResolved(writer) {
          defaultWriterClosedPromiseInitialize(writer);
          defaultWriterClosedPromiseResolve(writer);
        }
        function defaultWriterClosedPromiseReject(writer, reason) {
          if (writer._closedPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(writer._closedPromise);
          writer._closedPromise_reject(reason);
          writer._closedPromise_resolve = void 0;
          writer._closedPromise_reject = void 0;
          writer._closedPromiseState = "rejected";
        }
        function defaultWriterClosedPromiseResetToRejected(writer, reason) {
          defaultWriterClosedPromiseInitializeAsRejected(writer, reason);
        }
        function defaultWriterClosedPromiseResolve(writer) {
          if (writer._closedPromise_resolve === void 0) {
            return;
          }
          writer._closedPromise_resolve(void 0);
          writer._closedPromise_resolve = void 0;
          writer._closedPromise_reject = void 0;
          writer._closedPromiseState = "resolved";
        }
        function defaultWriterReadyPromiseInitialize(writer) {
          writer._readyPromise = newPromise((resolve2, reject) => {
            writer._readyPromise_resolve = resolve2;
            writer._readyPromise_reject = reject;
          });
          writer._readyPromiseState = "pending";
        }
        function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
          defaultWriterReadyPromiseInitialize(writer);
          defaultWriterReadyPromiseReject(writer, reason);
        }
        function defaultWriterReadyPromiseInitializeAsResolved(writer) {
          defaultWriterReadyPromiseInitialize(writer);
          defaultWriterReadyPromiseResolve(writer);
        }
        function defaultWriterReadyPromiseReject(writer, reason) {
          if (writer._readyPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(writer._readyPromise);
          writer._readyPromise_reject(reason);
          writer._readyPromise_resolve = void 0;
          writer._readyPromise_reject = void 0;
          writer._readyPromiseState = "rejected";
        }
        function defaultWriterReadyPromiseReset(writer) {
          defaultWriterReadyPromiseInitialize(writer);
        }
        function defaultWriterReadyPromiseResetToRejected(writer, reason) {
          defaultWriterReadyPromiseInitializeAsRejected(writer, reason);
        }
        function defaultWriterReadyPromiseResolve(writer) {
          if (writer._readyPromise_resolve === void 0) {
            return;
          }
          writer._readyPromise_resolve(void 0);
          writer._readyPromise_resolve = void 0;
          writer._readyPromise_reject = void 0;
          writer._readyPromiseState = "fulfilled";
        }
        const NativeDOMException = typeof DOMException !== "undefined" ? DOMException : void 0;
        function isDOMExceptionConstructor(ctor) {
          if (!(typeof ctor === "function" || typeof ctor === "object")) {
            return false;
          }
          try {
            new ctor();
            return true;
          } catch (_a) {
            return false;
          }
        }
        function createDOMExceptionPolyfill() {
          const ctor = function DOMException2(message, name) {
            this.message = message || "";
            this.name = name || "Error";
            if (Error.captureStackTrace) {
              Error.captureStackTrace(this, this.constructor);
            }
          };
          ctor.prototype = Object.create(Error.prototype);
          Object.defineProperty(ctor.prototype, "constructor", { value: ctor, writable: true, configurable: true });
          return ctor;
        }
        const DOMException$1 = isDOMExceptionConstructor(NativeDOMException) ? NativeDOMException : createDOMExceptionPolyfill();
        function ReadableStreamPipeTo(source, dest, preventClose, preventAbort, preventCancel, signal) {
          const reader = AcquireReadableStreamDefaultReader(source);
          const writer = AcquireWritableStreamDefaultWriter(dest);
          source._disturbed = true;
          let shuttingDown = false;
          let currentWrite = promiseResolvedWith(void 0);
          return newPromise((resolve2, reject) => {
            let abortAlgorithm;
            if (signal !== void 0) {
              abortAlgorithm = () => {
                const error2 = new DOMException$1("Aborted", "AbortError");
                const actions = [];
                if (!preventAbort) {
                  actions.push(() => {
                    if (dest._state === "writable") {
                      return WritableStreamAbort(dest, error2);
                    }
                    return promiseResolvedWith(void 0);
                  });
                }
                if (!preventCancel) {
                  actions.push(() => {
                    if (source._state === "readable") {
                      return ReadableStreamCancel(source, error2);
                    }
                    return promiseResolvedWith(void 0);
                  });
                }
                shutdownWithAction(() => Promise.all(actions.map((action) => action())), true, error2);
              };
              if (signal.aborted) {
                abortAlgorithm();
                return;
              }
              signal.addEventListener("abort", abortAlgorithm);
            }
            function pipeLoop() {
              return newPromise((resolveLoop, rejectLoop) => {
                function next(done) {
                  if (done) {
                    resolveLoop();
                  } else {
                    PerformPromiseThen(pipeStep(), next, rejectLoop);
                  }
                }
                next(false);
              });
            }
            function pipeStep() {
              if (shuttingDown) {
                return promiseResolvedWith(true);
              }
              return PerformPromiseThen(writer._readyPromise, () => {
                return newPromise((resolveRead, rejectRead) => {
                  ReadableStreamDefaultReaderRead(reader, {
                    _chunkSteps: (chunk) => {
                      currentWrite = PerformPromiseThen(WritableStreamDefaultWriterWrite(writer, chunk), void 0, noop2);
                      resolveRead(false);
                    },
                    _closeSteps: () => resolveRead(true),
                    _errorSteps: rejectRead
                  });
                });
              });
            }
            isOrBecomesErrored(source, reader._closedPromise, (storedError) => {
              if (!preventAbort) {
                shutdownWithAction(() => WritableStreamAbort(dest, storedError), true, storedError);
              } else {
                shutdown(true, storedError);
              }
            });
            isOrBecomesErrored(dest, writer._closedPromise, (storedError) => {
              if (!preventCancel) {
                shutdownWithAction(() => ReadableStreamCancel(source, storedError), true, storedError);
              } else {
                shutdown(true, storedError);
              }
            });
            isOrBecomesClosed(source, reader._closedPromise, () => {
              if (!preventClose) {
                shutdownWithAction(() => WritableStreamDefaultWriterCloseWithErrorPropagation(writer));
              } else {
                shutdown();
              }
            });
            if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === "closed") {
              const destClosed = new TypeError("the destination writable stream closed before all data could be piped to it");
              if (!preventCancel) {
                shutdownWithAction(() => ReadableStreamCancel(source, destClosed), true, destClosed);
              } else {
                shutdown(true, destClosed);
              }
            }
            setPromiseIsHandledToTrue(pipeLoop());
            function waitForWritesToFinish() {
              const oldCurrentWrite = currentWrite;
              return PerformPromiseThen(currentWrite, () => oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : void 0);
            }
            function isOrBecomesErrored(stream, promise, action) {
              if (stream._state === "errored") {
                action(stream._storedError);
              } else {
                uponRejection(promise, action);
              }
            }
            function isOrBecomesClosed(stream, promise, action) {
              if (stream._state === "closed") {
                action();
              } else {
                uponFulfillment(promise, action);
              }
            }
            function shutdownWithAction(action, originalIsError, originalError) {
              if (shuttingDown) {
                return;
              }
              shuttingDown = true;
              if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
                uponFulfillment(waitForWritesToFinish(), doTheRest);
              } else {
                doTheRest();
              }
              function doTheRest() {
                uponPromise(action(), () => finalize(originalIsError, originalError), (newError) => finalize(true, newError));
              }
            }
            function shutdown(isError, error2) {
              if (shuttingDown) {
                return;
              }
              shuttingDown = true;
              if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
                uponFulfillment(waitForWritesToFinish(), () => finalize(isError, error2));
              } else {
                finalize(isError, error2);
              }
            }
            function finalize(isError, error2) {
              WritableStreamDefaultWriterRelease(writer);
              ReadableStreamReaderGenericRelease(reader);
              if (signal !== void 0) {
                signal.removeEventListener("abort", abortAlgorithm);
              }
              if (isError) {
                reject(error2);
              } else {
                resolve2(void 0);
              }
            }
          });
        }
        class ReadableStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get desiredSize() {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("desiredSize");
            }
            return ReadableStreamDefaultControllerGetDesiredSize(this);
          }
          close() {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("close");
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
              throw new TypeError("The stream is not in a state that permits close");
            }
            ReadableStreamDefaultControllerClose(this);
          }
          enqueue(chunk = void 0) {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("enqueue");
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
              throw new TypeError("The stream is not in a state that permits enqueue");
            }
            return ReadableStreamDefaultControllerEnqueue(this, chunk);
          }
          error(e = void 0) {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("error");
            }
            ReadableStreamDefaultControllerError(this, e);
          }
          [CancelSteps](reason) {
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableStreamDefaultControllerClearAlgorithms(this);
            return result;
          }
          [PullSteps](readRequest) {
            const stream = this._controlledReadableStream;
            if (this._queue.length > 0) {
              const chunk = DequeueValue(this);
              if (this._closeRequested && this._queue.length === 0) {
                ReadableStreamDefaultControllerClearAlgorithms(this);
                ReadableStreamClose(stream);
              } else {
                ReadableStreamDefaultControllerCallPullIfNeeded(this);
              }
              readRequest._chunkSteps(chunk);
            } else {
              ReadableStreamAddReadRequest(stream, readRequest);
              ReadableStreamDefaultControllerCallPullIfNeeded(this);
            }
          }
        }
        Object.defineProperties(ReadableStreamDefaultController.prototype, {
          close: { enumerable: true },
          enqueue: { enumerable: true },
          error: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamDefaultController",
            configurable: true
          });
        }
        function IsReadableStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledReadableStream")) {
            return false;
          }
          return x instanceof ReadableStreamDefaultController;
        }
        function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
          const shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller);
          if (!shouldPull) {
            return;
          }
          if (controller._pulling) {
            controller._pullAgain = true;
            return;
          }
          controller._pulling = true;
          const pullPromise = controller._pullAlgorithm();
          uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
              controller._pullAgain = false;
              ReadableStreamDefaultControllerCallPullIfNeeded(controller);
            }
          }, (e) => {
            ReadableStreamDefaultControllerError(controller, e);
          });
        }
        function ReadableStreamDefaultControllerShouldCallPull(controller) {
          const stream = controller._controlledReadableStream;
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return false;
          }
          if (!controller._started) {
            return false;
          }
          if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
          }
          const desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller);
          if (desiredSize > 0) {
            return true;
          }
          return false;
        }
        function ReadableStreamDefaultControllerClearAlgorithms(controller) {
          controller._pullAlgorithm = void 0;
          controller._cancelAlgorithm = void 0;
          controller._strategySizeAlgorithm = void 0;
        }
        function ReadableStreamDefaultControllerClose(controller) {
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
          }
          const stream = controller._controlledReadableStream;
          controller._closeRequested = true;
          if (controller._queue.length === 0) {
            ReadableStreamDefaultControllerClearAlgorithms(controller);
            ReadableStreamClose(stream);
          }
        }
        function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
          }
          const stream = controller._controlledReadableStream;
          if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            ReadableStreamFulfillReadRequest(stream, chunk, false);
          } else {
            let chunkSize;
            try {
              chunkSize = controller._strategySizeAlgorithm(chunk);
            } catch (chunkSizeE) {
              ReadableStreamDefaultControllerError(controller, chunkSizeE);
              throw chunkSizeE;
            }
            try {
              EnqueueValueWithSize(controller, chunk, chunkSize);
            } catch (enqueueE) {
              ReadableStreamDefaultControllerError(controller, enqueueE);
              throw enqueueE;
            }
          }
          ReadableStreamDefaultControllerCallPullIfNeeded(controller);
        }
        function ReadableStreamDefaultControllerError(controller, e) {
          const stream = controller._controlledReadableStream;
          if (stream._state !== "readable") {
            return;
          }
          ResetQueue(controller);
          ReadableStreamDefaultControllerClearAlgorithms(controller);
          ReadableStreamError(stream, e);
        }
        function ReadableStreamDefaultControllerGetDesiredSize(controller) {
          const state = controller._controlledReadableStream._state;
          if (state === "errored") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function ReadableStreamDefaultControllerHasBackpressure(controller) {
          if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
            return false;
          }
          return true;
        }
        function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
          const state = controller._controlledReadableStream._state;
          if (!controller._closeRequested && state === "readable") {
            return true;
          }
          return false;
        }
        function SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm) {
          controller._controlledReadableStream = stream;
          controller._queue = void 0;
          controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._started = false;
          controller._closeRequested = false;
          controller._pullAgain = false;
          controller._pulling = false;
          controller._strategySizeAlgorithm = sizeAlgorithm;
          controller._strategyHWM = highWaterMark;
          controller._pullAlgorithm = pullAlgorithm;
          controller._cancelAlgorithm = cancelAlgorithm;
          stream._readableStreamController = controller;
          const startResult = startAlgorithm();
          uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableStreamDefaultControllerCallPullIfNeeded(controller);
          }, (r) => {
            ReadableStreamDefaultControllerError(controller, r);
          });
        }
        function SetUpReadableStreamDefaultControllerFromUnderlyingSource(stream, underlyingSource, highWaterMark, sizeAlgorithm) {
          const controller = Object.create(ReadableStreamDefaultController.prototype);
          let startAlgorithm = () => void 0;
          let pullAlgorithm = () => promiseResolvedWith(void 0);
          let cancelAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingSource.start !== void 0) {
            startAlgorithm = () => underlyingSource.start(controller);
          }
          if (underlyingSource.pull !== void 0) {
            pullAlgorithm = () => underlyingSource.pull(controller);
          }
          if (underlyingSource.cancel !== void 0) {
            cancelAlgorithm = (reason) => underlyingSource.cancel(reason);
          }
          SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
        }
        function defaultControllerBrandCheckException$1(name) {
          return new TypeError(`ReadableStreamDefaultController.prototype.${name} can only be used on a ReadableStreamDefaultController`);
        }
        function ReadableStreamTee(stream, cloneForBranch2) {
          if (IsReadableByteStreamController(stream._readableStreamController)) {
            return ReadableByteStreamTee(stream);
          }
          return ReadableStreamDefaultTee(stream);
        }
        function ReadableStreamDefaultTee(stream, cloneForBranch2) {
          const reader = AcquireReadableStreamDefaultReader(stream);
          let reading = false;
          let canceled1 = false;
          let canceled2 = false;
          let reason1;
          let reason2;
          let branch1;
          let branch2;
          let resolveCancelPromise;
          const cancelPromise = newPromise((resolve2) => {
            resolveCancelPromise = resolve2;
          });
          function pullAlgorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const readRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const chunk1 = chunk;
                  const chunk2 = chunk;
                  if (!canceled1) {
                    ReadableStreamDefaultControllerEnqueue(branch1._readableStreamController, chunk1);
                  }
                  if (!canceled2) {
                    ReadableStreamDefaultControllerEnqueue(branch2._readableStreamController, chunk2);
                  }
                });
              },
              _closeSteps: () => {
                reading = false;
                if (!canceled1) {
                  ReadableStreamDefaultControllerClose(branch1._readableStreamController);
                }
                if (!canceled2) {
                  ReadableStreamDefaultControllerClose(branch2._readableStreamController);
                }
                if (!canceled1 || !canceled2) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promiseResolvedWith(void 0);
          }
          function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function startAlgorithm() {
          }
          branch1 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm);
          branch2 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm);
          uponRejection(reader._closedPromise, (r) => {
            ReadableStreamDefaultControllerError(branch1._readableStreamController, r);
            ReadableStreamDefaultControllerError(branch2._readableStreamController, r);
            if (!canceled1 || !canceled2) {
              resolveCancelPromise(void 0);
            }
          });
          return [branch1, branch2];
        }
        function ReadableByteStreamTee(stream) {
          let reader = AcquireReadableStreamDefaultReader(stream);
          let reading = false;
          let canceled1 = false;
          let canceled2 = false;
          let reason1;
          let reason2;
          let branch1;
          let branch2;
          let resolveCancelPromise;
          const cancelPromise = newPromise((resolve2) => {
            resolveCancelPromise = resolve2;
          });
          function forwardReaderError(thisReader) {
            uponRejection(thisReader._closedPromise, (r) => {
              if (thisReader !== reader) {
                return;
              }
              ReadableByteStreamControllerError(branch1._readableStreamController, r);
              ReadableByteStreamControllerError(branch2._readableStreamController, r);
              if (!canceled1 || !canceled2) {
                resolveCancelPromise(void 0);
              }
            });
          }
          function pullWithDefaultReader() {
            if (IsReadableStreamBYOBReader(reader)) {
              ReadableStreamReaderGenericRelease(reader);
              reader = AcquireReadableStreamDefaultReader(stream);
              forwardReaderError(reader);
            }
            const readRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const chunk1 = chunk;
                  let chunk2 = chunk;
                  if (!canceled1 && !canceled2) {
                    try {
                      chunk2 = CloneAsUint8Array(chunk);
                    } catch (cloneE) {
                      ReadableByteStreamControllerError(branch1._readableStreamController, cloneE);
                      ReadableByteStreamControllerError(branch2._readableStreamController, cloneE);
                      resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                      return;
                    }
                  }
                  if (!canceled1) {
                    ReadableByteStreamControllerEnqueue(branch1._readableStreamController, chunk1);
                  }
                  if (!canceled2) {
                    ReadableByteStreamControllerEnqueue(branch2._readableStreamController, chunk2);
                  }
                });
              },
              _closeSteps: () => {
                reading = false;
                if (!canceled1) {
                  ReadableByteStreamControllerClose(branch1._readableStreamController);
                }
                if (!canceled2) {
                  ReadableByteStreamControllerClose(branch2._readableStreamController);
                }
                if (branch1._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(branch1._readableStreamController, 0);
                }
                if (branch2._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(branch2._readableStreamController, 0);
                }
                if (!canceled1 || !canceled2) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
          }
          function pullWithBYOBReader(view, forBranch2) {
            if (IsReadableStreamDefaultReader(reader)) {
              ReadableStreamReaderGenericRelease(reader);
              reader = AcquireReadableStreamBYOBReader(stream);
              forwardReaderError(reader);
            }
            const byobBranch = forBranch2 ? branch2 : branch1;
            const otherBranch = forBranch2 ? branch1 : branch2;
            const readIntoRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const byobCanceled = forBranch2 ? canceled2 : canceled1;
                  const otherCanceled = forBranch2 ? canceled1 : canceled2;
                  if (!otherCanceled) {
                    let clonedChunk;
                    try {
                      clonedChunk = CloneAsUint8Array(chunk);
                    } catch (cloneE) {
                      ReadableByteStreamControllerError(byobBranch._readableStreamController, cloneE);
                      ReadableByteStreamControllerError(otherBranch._readableStreamController, cloneE);
                      resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                      return;
                    }
                    if (!byobCanceled) {
                      ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                    }
                    ReadableByteStreamControllerEnqueue(otherBranch._readableStreamController, clonedChunk);
                  } else if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                });
              },
              _closeSteps: (chunk) => {
                reading = false;
                const byobCanceled = forBranch2 ? canceled2 : canceled1;
                const otherCanceled = forBranch2 ? canceled1 : canceled2;
                if (!byobCanceled) {
                  ReadableByteStreamControllerClose(byobBranch._readableStreamController);
                }
                if (!otherCanceled) {
                  ReadableByteStreamControllerClose(otherBranch._readableStreamController);
                }
                if (chunk !== void 0) {
                  if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                  if (!otherCanceled && otherBranch._readableStreamController._pendingPullIntos.length > 0) {
                    ReadableByteStreamControllerRespond(otherBranch._readableStreamController, 0);
                  }
                }
                if (!byobCanceled || !otherCanceled) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamBYOBReaderRead(reader, view, readIntoRequest);
          }
          function pull1Algorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch1._readableStreamController);
            if (byobRequest === null) {
              pullWithDefaultReader();
            } else {
              pullWithBYOBReader(byobRequest._view, false);
            }
            return promiseResolvedWith(void 0);
          }
          function pull2Algorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch2._readableStreamController);
            if (byobRequest === null) {
              pullWithDefaultReader();
            } else {
              pullWithBYOBReader(byobRequest._view, true);
            }
            return promiseResolvedWith(void 0);
          }
          function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function startAlgorithm() {
            return;
          }
          branch1 = CreateReadableByteStream(startAlgorithm, pull1Algorithm, cancel1Algorithm);
          branch2 = CreateReadableByteStream(startAlgorithm, pull2Algorithm, cancel2Algorithm);
          forwardReaderError(reader);
          return [branch1, branch2];
        }
        function convertUnderlyingDefaultOrByteSource(source, context) {
          assertDictionary(source, context);
          const original = source;
          const autoAllocateChunkSize = original === null || original === void 0 ? void 0 : original.autoAllocateChunkSize;
          const cancel = original === null || original === void 0 ? void 0 : original.cancel;
          const pull = original === null || original === void 0 ? void 0 : original.pull;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const type = original === null || original === void 0 ? void 0 : original.type;
          return {
            autoAllocateChunkSize: autoAllocateChunkSize === void 0 ? void 0 : convertUnsignedLongLongWithEnforceRange(autoAllocateChunkSize, `${context} has member 'autoAllocateChunkSize' that`),
            cancel: cancel === void 0 ? void 0 : convertUnderlyingSourceCancelCallback(cancel, original, `${context} has member 'cancel' that`),
            pull: pull === void 0 ? void 0 : convertUnderlyingSourcePullCallback(pull, original, `${context} has member 'pull' that`),
            start: start === void 0 ? void 0 : convertUnderlyingSourceStartCallback(start, original, `${context} has member 'start' that`),
            type: type === void 0 ? void 0 : convertReadableStreamType(type, `${context} has member 'type' that`)
          };
        }
        function convertUnderlyingSourceCancelCallback(fn, original, context) {
          assertFunction(fn, context);
          return (reason) => promiseCall(fn, original, [reason]);
        }
        function convertUnderlyingSourcePullCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => promiseCall(fn, original, [controller]);
        }
        function convertUnderlyingSourceStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertReadableStreamType(type, context) {
          type = `${type}`;
          if (type !== "bytes") {
            throw new TypeError(`${context} '${type}' is not a valid enumeration value for ReadableStreamType`);
          }
          return type;
        }
        function convertReaderOptions(options2, context) {
          assertDictionary(options2, context);
          const mode = options2 === null || options2 === void 0 ? void 0 : options2.mode;
          return {
            mode: mode === void 0 ? void 0 : convertReadableStreamReaderMode(mode, `${context} has member 'mode' that`)
          };
        }
        function convertReadableStreamReaderMode(mode, context) {
          mode = `${mode}`;
          if (mode !== "byob") {
            throw new TypeError(`${context} '${mode}' is not a valid enumeration value for ReadableStreamReaderMode`);
          }
          return mode;
        }
        function convertIteratorOptions(options2, context) {
          assertDictionary(options2, context);
          const preventCancel = options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
          return { preventCancel: Boolean(preventCancel) };
        }
        function convertPipeOptions(options2, context) {
          assertDictionary(options2, context);
          const preventAbort = options2 === null || options2 === void 0 ? void 0 : options2.preventAbort;
          const preventCancel = options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
          const preventClose = options2 === null || options2 === void 0 ? void 0 : options2.preventClose;
          const signal = options2 === null || options2 === void 0 ? void 0 : options2.signal;
          if (signal !== void 0) {
            assertAbortSignal(signal, `${context} has member 'signal' that`);
          }
          return {
            preventAbort: Boolean(preventAbort),
            preventCancel: Boolean(preventCancel),
            preventClose: Boolean(preventClose),
            signal
          };
        }
        function assertAbortSignal(signal, context) {
          if (!isAbortSignal2(signal)) {
            throw new TypeError(`${context} is not an AbortSignal.`);
          }
        }
        function convertReadableWritablePair(pair, context) {
          assertDictionary(pair, context);
          const readable = pair === null || pair === void 0 ? void 0 : pair.readable;
          assertRequiredField(readable, "readable", "ReadableWritablePair");
          assertReadableStream(readable, `${context} has member 'readable' that`);
          const writable2 = pair === null || pair === void 0 ? void 0 : pair.writable;
          assertRequiredField(writable2, "writable", "ReadableWritablePair");
          assertWritableStream(writable2, `${context} has member 'writable' that`);
          return { readable, writable: writable2 };
        }
        class ReadableStream2 {
          constructor(rawUnderlyingSource = {}, rawStrategy = {}) {
            if (rawUnderlyingSource === void 0) {
              rawUnderlyingSource = null;
            } else {
              assertObject(rawUnderlyingSource, "First parameter");
            }
            const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
            const underlyingSource = convertUnderlyingDefaultOrByteSource(rawUnderlyingSource, "First parameter");
            InitializeReadableStream(this);
            if (underlyingSource.type === "bytes") {
              if (strategy.size !== void 0) {
                throw new RangeError("The strategy for a byte stream cannot have a size function");
              }
              const highWaterMark = ExtractHighWaterMark(strategy, 0);
              SetUpReadableByteStreamControllerFromUnderlyingSource(this, underlyingSource, highWaterMark);
            } else {
              const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
              const highWaterMark = ExtractHighWaterMark(strategy, 1);
              SetUpReadableStreamDefaultControllerFromUnderlyingSource(this, underlyingSource, highWaterMark, sizeAlgorithm);
            }
          }
          get locked() {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("locked");
            }
            return IsReadableStreamLocked(this);
          }
          cancel(reason = void 0) {
            if (!IsReadableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$1("cancel"));
            }
            if (IsReadableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot cancel a stream that already has a reader"));
            }
            return ReadableStreamCancel(this, reason);
          }
          getReader(rawOptions = void 0) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("getReader");
            }
            const options2 = convertReaderOptions(rawOptions, "First parameter");
            if (options2.mode === void 0) {
              return AcquireReadableStreamDefaultReader(this);
            }
            return AcquireReadableStreamBYOBReader(this);
          }
          pipeThrough(rawTransform, rawOptions = {}) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("pipeThrough");
            }
            assertRequiredArgument(rawTransform, 1, "pipeThrough");
            const transform = convertReadableWritablePair(rawTransform, "First parameter");
            const options2 = convertPipeOptions(rawOptions, "Second parameter");
            if (IsReadableStreamLocked(this)) {
              throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
            }
            if (IsWritableStreamLocked(transform.writable)) {
              throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
            }
            const promise = ReadableStreamPipeTo(this, transform.writable, options2.preventClose, options2.preventAbort, options2.preventCancel, options2.signal);
            setPromiseIsHandledToTrue(promise);
            return transform.readable;
          }
          pipeTo(destination, rawOptions = {}) {
            if (!IsReadableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$1("pipeTo"));
            }
            if (destination === void 0) {
              return promiseRejectedWith(`Parameter 1 is required in 'pipeTo'.`);
            }
            if (!IsWritableStream(destination)) {
              return promiseRejectedWith(new TypeError(`ReadableStream.prototype.pipeTo's first argument must be a WritableStream`));
            }
            let options2;
            try {
              options2 = convertPipeOptions(rawOptions, "Second parameter");
            } catch (e) {
              return promiseRejectedWith(e);
            }
            if (IsReadableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream"));
            }
            if (IsWritableStreamLocked(destination)) {
              return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream"));
            }
            return ReadableStreamPipeTo(this, destination, options2.preventClose, options2.preventAbort, options2.preventCancel, options2.signal);
          }
          tee() {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("tee");
            }
            const branches = ReadableStreamTee(this);
            return CreateArrayFromList(branches);
          }
          values(rawOptions = void 0) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("values");
            }
            const options2 = convertIteratorOptions(rawOptions, "First parameter");
            return AcquireReadableStreamAsyncIterator(this, options2.preventCancel);
          }
        }
        Object.defineProperties(ReadableStream2.prototype, {
          cancel: { enumerable: true },
          getReader: { enumerable: true },
          pipeThrough: { enumerable: true },
          pipeTo: { enumerable: true },
          tee: { enumerable: true },
          values: { enumerable: true },
          locked: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStream",
            configurable: true
          });
        }
        if (typeof SymbolPolyfill.asyncIterator === "symbol") {
          Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.asyncIterator, {
            value: ReadableStream2.prototype.values,
            writable: true,
            configurable: true
          });
        }
        function CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
          const stream = Object.create(ReadableStream2.prototype);
          InitializeReadableStream(stream);
          const controller = Object.create(ReadableStreamDefaultController.prototype);
          SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
          return stream;
        }
        function CreateReadableByteStream(startAlgorithm, pullAlgorithm, cancelAlgorithm) {
          const stream = Object.create(ReadableStream2.prototype);
          InitializeReadableStream(stream);
          const controller = Object.create(ReadableByteStreamController.prototype);
          SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, 0, void 0);
          return stream;
        }
        function InitializeReadableStream(stream) {
          stream._state = "readable";
          stream._reader = void 0;
          stream._storedError = void 0;
          stream._disturbed = false;
        }
        function IsReadableStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readableStreamController")) {
            return false;
          }
          return x instanceof ReadableStream2;
        }
        function IsReadableStreamLocked(stream) {
          if (stream._reader === void 0) {
            return false;
          }
          return true;
        }
        function ReadableStreamCancel(stream, reason) {
          stream._disturbed = true;
          if (stream._state === "closed") {
            return promiseResolvedWith(void 0);
          }
          if (stream._state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          ReadableStreamClose(stream);
          const reader = stream._reader;
          if (reader !== void 0 && IsReadableStreamBYOBReader(reader)) {
            reader._readIntoRequests.forEach((readIntoRequest) => {
              readIntoRequest._closeSteps(void 0);
            });
            reader._readIntoRequests = new SimpleQueue();
          }
          const sourceCancelPromise = stream._readableStreamController[CancelSteps](reason);
          return transformPromiseWith(sourceCancelPromise, noop2);
        }
        function ReadableStreamClose(stream) {
          stream._state = "closed";
          const reader = stream._reader;
          if (reader === void 0) {
            return;
          }
          defaultReaderClosedPromiseResolve(reader);
          if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach((readRequest) => {
              readRequest._closeSteps();
            });
            reader._readRequests = new SimpleQueue();
          }
        }
        function ReadableStreamError(stream, e) {
          stream._state = "errored";
          stream._storedError = e;
          const reader = stream._reader;
          if (reader === void 0) {
            return;
          }
          defaultReaderClosedPromiseReject(reader, e);
          if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach((readRequest) => {
              readRequest._errorSteps(e);
            });
            reader._readRequests = new SimpleQueue();
          } else {
            reader._readIntoRequests.forEach((readIntoRequest) => {
              readIntoRequest._errorSteps(e);
            });
            reader._readIntoRequests = new SimpleQueue();
          }
        }
        function streamBrandCheckException$1(name) {
          return new TypeError(`ReadableStream.prototype.${name} can only be used on a ReadableStream`);
        }
        function convertQueuingStrategyInit(init2, context) {
          assertDictionary(init2, context);
          const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
          assertRequiredField(highWaterMark, "highWaterMark", "QueuingStrategyInit");
          return {
            highWaterMark: convertUnrestrictedDouble(highWaterMark)
          };
        }
        const byteLengthSizeFunction = (chunk) => {
          return chunk.byteLength;
        };
        Object.defineProperty(byteLengthSizeFunction, "name", {
          value: "size",
          configurable: true
        });
        class ByteLengthQueuingStrategy {
          constructor(options2) {
            assertRequiredArgument(options2, 1, "ByteLengthQueuingStrategy");
            options2 = convertQueuingStrategyInit(options2, "First parameter");
            this._byteLengthQueuingStrategyHighWaterMark = options2.highWaterMark;
          }
          get highWaterMark() {
            if (!IsByteLengthQueuingStrategy(this)) {
              throw byteLengthBrandCheckException("highWaterMark");
            }
            return this._byteLengthQueuingStrategyHighWaterMark;
          }
          get size() {
            if (!IsByteLengthQueuingStrategy(this)) {
              throw byteLengthBrandCheckException("size");
            }
            return byteLengthSizeFunction;
          }
        }
        Object.defineProperties(ByteLengthQueuingStrategy.prototype, {
          highWaterMark: { enumerable: true },
          size: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ByteLengthQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: "ByteLengthQueuingStrategy",
            configurable: true
          });
        }
        function byteLengthBrandCheckException(name) {
          return new TypeError(`ByteLengthQueuingStrategy.prototype.${name} can only be used on a ByteLengthQueuingStrategy`);
        }
        function IsByteLengthQueuingStrategy(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_byteLengthQueuingStrategyHighWaterMark")) {
            return false;
          }
          return x instanceof ByteLengthQueuingStrategy;
        }
        const countSizeFunction = () => {
          return 1;
        };
        Object.defineProperty(countSizeFunction, "name", {
          value: "size",
          configurable: true
        });
        class CountQueuingStrategy {
          constructor(options2) {
            assertRequiredArgument(options2, 1, "CountQueuingStrategy");
            options2 = convertQueuingStrategyInit(options2, "First parameter");
            this._countQueuingStrategyHighWaterMark = options2.highWaterMark;
          }
          get highWaterMark() {
            if (!IsCountQueuingStrategy(this)) {
              throw countBrandCheckException("highWaterMark");
            }
            return this._countQueuingStrategyHighWaterMark;
          }
          get size() {
            if (!IsCountQueuingStrategy(this)) {
              throw countBrandCheckException("size");
            }
            return countSizeFunction;
          }
        }
        Object.defineProperties(CountQueuingStrategy.prototype, {
          highWaterMark: { enumerable: true },
          size: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(CountQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: "CountQueuingStrategy",
            configurable: true
          });
        }
        function countBrandCheckException(name) {
          return new TypeError(`CountQueuingStrategy.prototype.${name} can only be used on a CountQueuingStrategy`);
        }
        function IsCountQueuingStrategy(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_countQueuingStrategyHighWaterMark")) {
            return false;
          }
          return x instanceof CountQueuingStrategy;
        }
        function convertTransformer(original, context) {
          assertDictionary(original, context);
          const flush = original === null || original === void 0 ? void 0 : original.flush;
          const readableType = original === null || original === void 0 ? void 0 : original.readableType;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const transform = original === null || original === void 0 ? void 0 : original.transform;
          const writableType = original === null || original === void 0 ? void 0 : original.writableType;
          return {
            flush: flush === void 0 ? void 0 : convertTransformerFlushCallback(flush, original, `${context} has member 'flush' that`),
            readableType,
            start: start === void 0 ? void 0 : convertTransformerStartCallback(start, original, `${context} has member 'start' that`),
            transform: transform === void 0 ? void 0 : convertTransformerTransformCallback(transform, original, `${context} has member 'transform' that`),
            writableType
          };
        }
        function convertTransformerFlushCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => promiseCall(fn, original, [controller]);
        }
        function convertTransformerStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertTransformerTransformCallback(fn, original, context) {
          assertFunction(fn, context);
          return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
        }
        class TransformStream {
          constructor(rawTransformer = {}, rawWritableStrategy = {}, rawReadableStrategy = {}) {
            if (rawTransformer === void 0) {
              rawTransformer = null;
            }
            const writableStrategy = convertQueuingStrategy(rawWritableStrategy, "Second parameter");
            const readableStrategy = convertQueuingStrategy(rawReadableStrategy, "Third parameter");
            const transformer = convertTransformer(rawTransformer, "First parameter");
            if (transformer.readableType !== void 0) {
              throw new RangeError("Invalid readableType specified");
            }
            if (transformer.writableType !== void 0) {
              throw new RangeError("Invalid writableType specified");
            }
            const readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0);
            const readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy);
            const writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1);
            const writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy);
            let startPromise_resolve;
            const startPromise = newPromise((resolve2) => {
              startPromise_resolve = resolve2;
            });
            InitializeTransformStream(this, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
            SetUpTransformStreamDefaultControllerFromTransformer(this, transformer);
            if (transformer.start !== void 0) {
              startPromise_resolve(transformer.start(this._transformStreamController));
            } else {
              startPromise_resolve(void 0);
            }
          }
          get readable() {
            if (!IsTransformStream(this)) {
              throw streamBrandCheckException("readable");
            }
            return this._readable;
          }
          get writable() {
            if (!IsTransformStream(this)) {
              throw streamBrandCheckException("writable");
            }
            return this._writable;
          }
        }
        Object.defineProperties(TransformStream.prototype, {
          readable: { enumerable: true },
          writable: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(TransformStream.prototype, SymbolPolyfill.toStringTag, {
            value: "TransformStream",
            configurable: true
          });
        }
        function InitializeTransformStream(stream, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm) {
          function startAlgorithm() {
            return startPromise;
          }
          function writeAlgorithm(chunk) {
            return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk);
          }
          function abortAlgorithm(reason) {
            return TransformStreamDefaultSinkAbortAlgorithm(stream, reason);
          }
          function closeAlgorithm() {
            return TransformStreamDefaultSinkCloseAlgorithm(stream);
          }
          stream._writable = CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, writableHighWaterMark, writableSizeAlgorithm);
          function pullAlgorithm() {
            return TransformStreamDefaultSourcePullAlgorithm(stream);
          }
          function cancelAlgorithm(reason) {
            TransformStreamErrorWritableAndUnblockWrite(stream, reason);
            return promiseResolvedWith(void 0);
          }
          stream._readable = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
          stream._backpressure = void 0;
          stream._backpressureChangePromise = void 0;
          stream._backpressureChangePromise_resolve = void 0;
          TransformStreamSetBackpressure(stream, true);
          stream._transformStreamController = void 0;
        }
        function IsTransformStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_transformStreamController")) {
            return false;
          }
          return x instanceof TransformStream;
        }
        function TransformStreamError(stream, e) {
          ReadableStreamDefaultControllerError(stream._readable._readableStreamController, e);
          TransformStreamErrorWritableAndUnblockWrite(stream, e);
        }
        function TransformStreamErrorWritableAndUnblockWrite(stream, e) {
          TransformStreamDefaultControllerClearAlgorithms(stream._transformStreamController);
          WritableStreamDefaultControllerErrorIfNeeded(stream._writable._writableStreamController, e);
          if (stream._backpressure) {
            TransformStreamSetBackpressure(stream, false);
          }
        }
        function TransformStreamSetBackpressure(stream, backpressure) {
          if (stream._backpressureChangePromise !== void 0) {
            stream._backpressureChangePromise_resolve();
          }
          stream._backpressureChangePromise = newPromise((resolve2) => {
            stream._backpressureChangePromise_resolve = resolve2;
          });
          stream._backpressure = backpressure;
        }
        class TransformStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get desiredSize() {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("desiredSize");
            }
            const readableController = this._controlledTransformStream._readable._readableStreamController;
            return ReadableStreamDefaultControllerGetDesiredSize(readableController);
          }
          enqueue(chunk = void 0) {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("enqueue");
            }
            TransformStreamDefaultControllerEnqueue(this, chunk);
          }
          error(reason = void 0) {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("error");
            }
            TransformStreamDefaultControllerError(this, reason);
          }
          terminate() {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("terminate");
            }
            TransformStreamDefaultControllerTerminate(this);
          }
        }
        Object.defineProperties(TransformStreamDefaultController.prototype, {
          enqueue: { enumerable: true },
          error: { enumerable: true },
          terminate: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(TransformStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "TransformStreamDefaultController",
            configurable: true
          });
        }
        function IsTransformStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledTransformStream")) {
            return false;
          }
          return x instanceof TransformStreamDefaultController;
        }
        function SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm) {
          controller._controlledTransformStream = stream;
          stream._transformStreamController = controller;
          controller._transformAlgorithm = transformAlgorithm;
          controller._flushAlgorithm = flushAlgorithm;
        }
        function SetUpTransformStreamDefaultControllerFromTransformer(stream, transformer) {
          const controller = Object.create(TransformStreamDefaultController.prototype);
          let transformAlgorithm = (chunk) => {
            try {
              TransformStreamDefaultControllerEnqueue(controller, chunk);
              return promiseResolvedWith(void 0);
            } catch (transformResultE) {
              return promiseRejectedWith(transformResultE);
            }
          };
          let flushAlgorithm = () => promiseResolvedWith(void 0);
          if (transformer.transform !== void 0) {
            transformAlgorithm = (chunk) => transformer.transform(chunk, controller);
          }
          if (transformer.flush !== void 0) {
            flushAlgorithm = () => transformer.flush(controller);
          }
          SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm);
        }
        function TransformStreamDefaultControllerClearAlgorithms(controller) {
          controller._transformAlgorithm = void 0;
          controller._flushAlgorithm = void 0;
        }
        function TransformStreamDefaultControllerEnqueue(controller, chunk) {
          const stream = controller._controlledTransformStream;
          const readableController = stream._readable._readableStreamController;
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
            throw new TypeError("Readable side is not in a state that permits enqueue");
          }
          try {
            ReadableStreamDefaultControllerEnqueue(readableController, chunk);
          } catch (e) {
            TransformStreamErrorWritableAndUnblockWrite(stream, e);
            throw stream._readable._storedError;
          }
          const backpressure = ReadableStreamDefaultControllerHasBackpressure(readableController);
          if (backpressure !== stream._backpressure) {
            TransformStreamSetBackpressure(stream, true);
          }
        }
        function TransformStreamDefaultControllerError(controller, e) {
          TransformStreamError(controller._controlledTransformStream, e);
        }
        function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
          const transformPromise = controller._transformAlgorithm(chunk);
          return transformPromiseWith(transformPromise, void 0, (r) => {
            TransformStreamError(controller._controlledTransformStream, r);
            throw r;
          });
        }
        function TransformStreamDefaultControllerTerminate(controller) {
          const stream = controller._controlledTransformStream;
          const readableController = stream._readable._readableStreamController;
          ReadableStreamDefaultControllerClose(readableController);
          const error2 = new TypeError("TransformStream terminated");
          TransformStreamErrorWritableAndUnblockWrite(stream, error2);
        }
        function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
          const controller = stream._transformStreamController;
          if (stream._backpressure) {
            const backpressureChangePromise = stream._backpressureChangePromise;
            return transformPromiseWith(backpressureChangePromise, () => {
              const writable2 = stream._writable;
              const state = writable2._state;
              if (state === "erroring") {
                throw writable2._storedError;
              }
              return TransformStreamDefaultControllerPerformTransform(controller, chunk);
            });
          }
          return TransformStreamDefaultControllerPerformTransform(controller, chunk);
        }
        function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
          TransformStreamError(stream, reason);
          return promiseResolvedWith(void 0);
        }
        function TransformStreamDefaultSinkCloseAlgorithm(stream) {
          const readable = stream._readable;
          const controller = stream._transformStreamController;
          const flushPromise = controller._flushAlgorithm();
          TransformStreamDefaultControllerClearAlgorithms(controller);
          return transformPromiseWith(flushPromise, () => {
            if (readable._state === "errored") {
              throw readable._storedError;
            }
            ReadableStreamDefaultControllerClose(readable._readableStreamController);
          }, (r) => {
            TransformStreamError(stream, r);
            throw readable._storedError;
          });
        }
        function TransformStreamDefaultSourcePullAlgorithm(stream) {
          TransformStreamSetBackpressure(stream, false);
          return stream._backpressureChangePromise;
        }
        function defaultControllerBrandCheckException(name) {
          return new TypeError(`TransformStreamDefaultController.prototype.${name} can only be used on a TransformStreamDefaultController`);
        }
        function streamBrandCheckException(name) {
          return new TypeError(`TransformStream.prototype.${name} can only be used on a TransformStream`);
        }
        exports2.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
        exports2.CountQueuingStrategy = CountQueuingStrategy;
        exports2.ReadableByteStreamController = ReadableByteStreamController;
        exports2.ReadableStream = ReadableStream2;
        exports2.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
        exports2.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest;
        exports2.ReadableStreamDefaultController = ReadableStreamDefaultController;
        exports2.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
        exports2.TransformStream = TransformStream;
        exports2.TransformStreamDefaultController = TransformStreamDefaultController;
        exports2.WritableStream = WritableStream;
        exports2.WritableStreamDefaultController = WritableStreamDefaultController;
        exports2.WritableStreamDefaultWriter = WritableStreamDefaultWriter;
        Object.defineProperty(exports2, "__esModule", { value: true });
      });
    })(ponyfill_es2018, ponyfill_es2018.exports);
    POOL_SIZE$1 = 65536;
    if (!globalThis.ReadableStream) {
      try {
        const process2 = require("node:process");
        const { emitWarning } = process2;
        try {
          process2.emitWarning = () => {
          };
          Object.assign(globalThis, require("node:stream/web"));
          process2.emitWarning = emitWarning;
        } catch (error2) {
          process2.emitWarning = emitWarning;
          throw error2;
        }
      } catch (error2) {
        Object.assign(globalThis, ponyfill_es2018.exports);
      }
    }
    try {
      const { Blob: Blob3 } = require("buffer");
      if (Blob3 && !Blob3.prototype.stream) {
        Blob3.prototype.stream = function name(params) {
          let position = 0;
          const blob = this;
          return new ReadableStream({
            type: "bytes",
            async pull(ctrl) {
              const chunk = blob.slice(position, Math.min(blob.size, position + POOL_SIZE$1));
              const buffer = await chunk.arrayBuffer();
              position += buffer.byteLength;
              ctrl.enqueue(new Uint8Array(buffer));
              if (position === blob.size) {
                ctrl.close();
              }
            }
          });
        };
      }
    } catch (error2) {
    }
    POOL_SIZE = 65536;
    _Blob = class Blob {
      #parts = [];
      #type = "";
      #size = 0;
      constructor(blobParts = [], options2 = {}) {
        if (typeof blobParts !== "object" || blobParts === null) {
          throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
        }
        if (typeof blobParts[Symbol.iterator] !== "function") {
          throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
        }
        if (typeof options2 !== "object" && typeof options2 !== "function") {
          throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
        }
        if (options2 === null)
          options2 = {};
        const encoder = new TextEncoder();
        for (const element of blobParts) {
          let part;
          if (ArrayBuffer.isView(element)) {
            part = new Uint8Array(element.buffer.slice(element.byteOffset, element.byteOffset + element.byteLength));
          } else if (element instanceof ArrayBuffer) {
            part = new Uint8Array(element.slice(0));
          } else if (element instanceof Blob) {
            part = element;
          } else {
            part = encoder.encode(element);
          }
          this.#size += ArrayBuffer.isView(part) ? part.byteLength : part.size;
          this.#parts.push(part);
        }
        const type = options2.type === void 0 ? "" : String(options2.type);
        this.#type = /^[\x20-\x7E]*$/.test(type) ? type : "";
      }
      get size() {
        return this.#size;
      }
      get type() {
        return this.#type;
      }
      async text() {
        const decoder = new TextDecoder();
        let str = "";
        for await (const part of toIterator(this.#parts, false)) {
          str += decoder.decode(part, { stream: true });
        }
        str += decoder.decode();
        return str;
      }
      async arrayBuffer() {
        const data2 = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of toIterator(this.#parts, false)) {
          data2.set(chunk, offset);
          offset += chunk.length;
        }
        return data2.buffer;
      }
      stream() {
        const it = toIterator(this.#parts, true);
        return new globalThis.ReadableStream({
          type: "bytes",
          async pull(ctrl) {
            const chunk = await it.next();
            chunk.done ? ctrl.close() : ctrl.enqueue(chunk.value);
          },
          async cancel() {
            await it.return();
          }
        });
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = this.#parts;
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          if (added >= span) {
            break;
          }
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            let chunk;
            if (ArrayBuffer.isView(part)) {
              chunk = part.subarray(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.byteLength;
            } else {
              chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.size;
            }
            relativeEnd -= size2;
            blobParts.push(chunk);
            relativeStart = 0;
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        blob.#size = span;
        blob.#parts = blobParts;
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.constructor === "function" && (typeof object.stream === "function" || typeof object.arrayBuffer === "function") && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(_Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    Blob2 = _Blob;
    Blob$1 = Blob2;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && (object[NAME] === "AbortSignal" || object[NAME] === "EventTarget");
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (error_) => {
            const error2 = error_ instanceof FetchBaseError ? error_ : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${error_.message}`, "system", error_);
            this[INTERNALS$2].error = error2;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new Blob$1([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        import_stream.default.Readable.from(body.stream()).pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const error2 = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(error2, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw error2;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const error2 = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(error2, "code", { value: "ERR_INVALID_CHAR" });
        throw error2;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(target, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(target, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback, thisArg = void 0) {
        for (const name of this.keys()) {
          Reflect.apply(callback, thisArg, [this.get(name), name, this]);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status != null ? options2.status : 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          type: "default",
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get type() {
        return this[INTERNALS$1].type;
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          type: this.type,
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      static error() {
        const response = new Response(null, { status: 0, statusText: "" });
        response[INTERNALS$1].type = "error";
        return response;
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      type: { enumerable: true },
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal != null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-vercel/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-vercel/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/@sveltejs/kit/dist/chunks/url.js
function get_single_valued_header(headers, key) {
  const value = headers[key];
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return void 0;
    }
    if (value.length > 1) {
      throw new Error(`Multiple headers provided for ${key}. Multiple may be provided only for set-cookie`);
    }
    return value[0];
  }
  return value;
}
function resolve(base2, path) {
  if (scheme.test(path))
    return path;
  const base_match = absolute.exec(base2);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base2}"`);
  }
  const baseparts = path_match ? [] : base2.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
function is_root_relative(path) {
  return path[0] === "/" && path[1] !== "/";
}
var absolute, scheme;
var init_url = __esm({
  "node_modules/@sveltejs/kit/dist/chunks/url.js"() {
    init_shims();
    absolute = /^([a-z]+:)?\/?\//;
    scheme = /^[a-z]+:/;
  }
});

// node_modules/@sveltejs/kit/dist/chunks/error.js
function coalesce_to_error(err) {
  return err instanceof Error || err && err.name && err.message ? err : new Error(JSON.stringify(err));
}
var init_error = __esm({
  "node_modules/@sveltejs/kit/dist/chunks/error.js"() {
    init_shims();
  }
});

// node_modules/@sveltejs/kit/dist/ssr.js
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
function is_content_type_textual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}
async function render_endpoint(request, route, match) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler) {
    return;
  }
  const params = route.params(match);
  const response = await handler({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = get_single_valued_header(headers, "content-type");
  const is_type_textual = is_content_type_textual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function writable(value, start = noop) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
function escape_json_string_in_html(str) {
  return escape(str, escape_json_string_in_html_dict, (code) => `\\u${code.toString(16).toUpperCase()}`);
}
function escape_html_attr(str) {
  return '"' + escape(str, escape_html_attr_dict, (code) => `&#${code};`) + '"';
}
function escape(str, dict, unicode_encoder) {
  let result = "";
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char in dict) {
      result += dict[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += unicode_encoder(code);
      }
    } else {
      result += char;
    }
  }
  return result;
}
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error2,
  page
}) {
  const css6 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error2) {
    error2.stack = options2.get_stack(error2);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css6.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css6).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
    init2 += options2.service_worker ? '<script async custom-element="amp-install-serviceworker" src="https://cdn.ampproject.org/v0/amp-install-serviceworker-0.1.js"><\/script>' : "";
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page && page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${page && page.path ? try_serialize(page.path, (error3) => {
      throw new Error(`Failed to serialize page.path: ${error3.message}`);
    }) : null},
						query: new URLSearchParams(${page && page.query ? s$1(page.query.toString()) : ""}),
						params: ${page && page.params ? try_serialize(page.params, (error3) => {
      throw new Error(`Failed to serialize page.params: ${error3.message}`);
    }) : null}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += options2.amp ? `<amp-install-serviceworker src="${options2.service_worker}" layout="nodisplay"></amp-install-serviceworker>` : `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url=${escape_html_attr(url)}`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n	")}
		`;
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data2, fail) {
  try {
    return devalue(data2);
  } catch (err) {
    if (fail)
      fail(coalesce_to_error(err));
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const { name, message, stack } = error2;
    serialized = try_serialize({ ...error2, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error2 };
    }
    return { status, error: error2 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  if (loaded.context) {
    throw new Error('You are returning "context" from a load function. "context" was renamed to "stuff", please adjust your code accordingly.');
  }
  return loaded;
}
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  stuff,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error2
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let set_cookie_headers = [];
  let loaded;
  const page_proxy = new Proxy(page, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module2.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const prefix = options2.paths.assets || options2.paths.base;
        const filename = (resolved.startsWith(prefix) ? resolved.slice(prefix.length) : resolved).slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d2) => d2.file === filename || d2.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? { "content-type": asset.type } : {}
          }) : await fetch(`http://${page.host}/${asset.file}`, opts);
        } else if (is_root_relative(resolved)) {
          const relative = resolved;
          const headers = {
            ...opts.headers
          };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body == null ? null : new TextEncoder().encode(opts.body),
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.externalFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, _receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 === "set-cookie") {
                    set_cookie_headers = set_cookie_headers.concat(value);
                  } else if (key2 !== "etag") {
                    headers[key2] = value;
                  }
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":"${escape_json_string_in_html(body)}"}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      stuff: { ...stuff }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error2;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    stuff: loaded.stuff || stuff,
    fetched,
    set_cookie_headers,
    uses_credentials
  };
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error2 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    stuff: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      stuff: loaded ? loaded.stuff : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error2
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error2,
      branch,
      page
    });
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return {
      status: 500,
      headers: {},
      body: error3.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {}
    };
  }
  let branch = [];
  let status = 200;
  let error2;
  let set_cookie_headers = [];
  ssr:
    if (page_config.ssr) {
      let stuff = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              ...opts,
              node,
              stuff,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            set_cookie_headers = set_cookie_headers.concat(loaded.set_cookie_headers);
            if (loaded.loaded.redirect) {
              return with_cookies({
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              }, set_cookie_headers);
            }
            if (loaded.loaded.error) {
              ({ status, error: error2 } = loaded.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error2 = e;
          }
          if (loaded && !error2) {
            branch.push(loaded);
          }
          if (error2) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    stuff: node_loaded.stuff,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error2
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e, request);
                  continue;
                }
              }
            }
            return with_cookies(await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error2
            }), set_cookie_headers);
          }
        }
        if (loaded && loaded.loaded.stuff) {
          stuff = {
            ...stuff,
            ...loaded.loaded.stuff
          };
        }
      }
    }
  try {
    return with_cookies(await render_response({
      ...opts,
      page_config,
      status,
      error: error2,
      branch: branch.filter(Boolean)
    }), set_cookie_headers);
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return with_cookies(await respond_with_error({
      ...opts,
      status: 500,
      error: error3
    }), set_cookie_headers);
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
function with_cookies(response, set_cookie_headers) {
  if (set_cookie_headers.length) {
    response.headers["set-cookie"] = set_cookie_headers;
  }
  return response;
}
async function render_page(request, route, match, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const content_type = headers["content-type"];
  const [type, ...directives] = content_type ? content_type.split(/;\s*/) : [];
  const text = () => new TextDecoder(headers["content-encoding"] || "utf-8").decode(raw);
  switch (type) {
    case "text/plain":
      return text();
    case "application/json":
      return JSON.parse(text());
    case "application/x-www-form-urlencoded":
      return get_urlencoded(text());
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(text(), boundary.slice("boundary=".length));
    }
    default:
      return raw;
  }
}
function get_urlencoded(text) {
  const { data: data2, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data2;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data: data2, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      headers[name] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data2;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: options2.paths.base + path + (q ? `?${q}` : "")
        }
      };
    }
  }
  const headers = lowercase_keys(incoming.headers);
  const request = {
    ...incoming,
    headers,
    body: parse_body(incoming.rawBody, headers),
    params: {},
    locals: {}
  };
  try {
    return await options2.hooks.handle({
      request,
      resolve: async (request2) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request2),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        const decoded = decodeURI(request2.path);
        for (const route of options2.manifest.routes) {
          const match = route.pattern.exec(decoded);
          if (!match)
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request2, route, match) : await render_page(request2, route, match, options2, state);
          if (response) {
            if (response.status === 200) {
              const cache_control = get_single_valued_header(response.headers, "cache-control");
              if (!cache_control || !/(no-store|immutable)/.test(cache_control)) {
                let if_none_match_value = request2.headers["if-none-match"];
                if (if_none_match_value?.startsWith('W/"')) {
                  if_none_match_value = if_none_match_value.substring(2);
                }
                const etag = `"${hash(response.body || "")}"`;
                if (if_none_match_value === etag) {
                  return {
                    status: 304,
                    headers: {}
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request2);
        return await respond_with_error({
          request: request2,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request2.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e, request);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
var chars, unsafeChars, reserved, escaped, objectProtoOwnPropertyNames, subscriber_queue, escape_json_string_in_html_dict, escape_html_attr_dict, s$1, s, ReadOnlyFormData;
var init_ssr = __esm({
  "node_modules/@sveltejs/kit/dist/ssr.js"() {
    init_shims();
    init_url();
    init_error();
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
    unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
    reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
    escaped = {
      "<": "\\u003C",
      ">": "\\u003E",
      "/": "\\u002F",
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
    Promise.resolve();
    subscriber_queue = [];
    escape_json_string_in_html_dict = {
      '"': '\\"',
      "<": "\\u003C",
      ">": "\\u003E",
      "/": "\\u002F",
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    escape_html_attr_dict = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    };
    s$1 = JSON.stringify;
    s = JSON.stringify;
    ReadOnlyFormData = class {
      #map;
      constructor(map) {
        this.#map = map;
      }
      get(key) {
        const value = this.#map.get(key);
        return value && value[0];
      }
      getAll(key) {
        return this.#map.get(key);
      }
      has(key) {
        return this.#map.has(key);
      }
      *[Symbol.iterator]() {
        for (const [key, value] of this.#map) {
          for (let i = 0; i < value.length; i += 1) {
            yield [key, value[i]];
          }
        }
      }
      *entries() {
        for (const [key, value] of this.#map) {
          for (let i = 0; i < value.length; i += 1) {
            yield [key, value[i]];
          }
        }
      }
      *keys() {
        for (const [key] of this.#map)
          yield key;
      }
      *values() {
        for (const [, value] of this.#map) {
          for (let i = 0; i < value.length; i += 1) {
            yield value[i];
          }
        }
      }
    };
  }
});

// node_modules/cookie/index.js
var require_cookie = __commonJS({
  "node_modules/cookie/index.js"(exports) {
    init_shims();
    "use strict";
    exports.parse = parse;
    exports.serialize = serialize;
    var decode = decodeURIComponent;
    var encode = encodeURIComponent;
    var pairSplitRegExp = /; */;
    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
    function parse(str, options2) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options2 || {};
      var pairs = str.split(pairSplitRegExp);
      var dec = opt.decode || decode;
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var eq_idx = pair.indexOf("=");
        if (eq_idx < 0) {
          continue;
        }
        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();
        if (val[0] == '"') {
          val = val.slice(1, -1);
        }
        if (obj[key] == void 0) {
          obj[key] = tryDecode(val, dec);
        }
      }
      return obj;
    }
    function serialize(name, val, options2) {
      var opt = options2 || {};
      var enc = opt.encode || encode;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (opt.maxAge != null) {
        var maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        if (typeof opt.expires.toUTCString !== "function") {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + opt.expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e) {
        return str;
      }
    }
  }
});

// node_modules/@lukeed/uuid/dist/index.mjs
function v4() {
  var i = 0, num, out = "";
  if (!BUFFER || IDX + 16 > 256) {
    BUFFER = Array(i = 256);
    while (i--)
      BUFFER[i] = 256 * Math.random() | 0;
    i = IDX = 0;
  }
  for (; i < 16; i++) {
    num = BUFFER[IDX + i];
    if (i == 6)
      out += HEX[num & 15 | 64];
    else if (i == 8)
      out += HEX[num & 63 | 128];
    else
      out += HEX[num];
    if (i & 1 && i > 1 && i < 11)
      out += "-";
  }
  IDX++;
  return out;
}
var IDX, HEX, BUFFER;
var init_dist = __esm({
  "node_modules/@lukeed/uuid/dist/index.mjs"() {
    init_shims();
    IDX = 256;
    HEX = [];
    while (IDX--)
      HEX[IDX] = (IDX + 256).toString(16).substring(1);
  }
});

// .svelte-kit/output/server/chunks/_posts-94db3c2d.js
var data;
var init_posts_94db3c2d = __esm({
  ".svelte-kit/output/server/chunks/_posts-94db3c2d.js"() {
    init_shims();
    data = [
      {
        id: "60eb0fac9b9799001eba3160",
        uuid: "50007fc0-ee97-4c23-8632-7c19ee1f0647",
        title: "Optional chaining without ES11? - Safely Access - Javascript Tips & Tricks",
        slug: "optional-chaining-without-es11-safely-access",
        html: `<p>As you know, <strong>every year EcmaScript releases a new version to improve JavaScript</strong>, these improvements have made our lives easier, and have allowed us to do things that we could not do with the language natively before, or that required many lines of code.<br><br>In this post we will talk a little bit about <strong>optional chaining</strong> <em>(implemented in ES11/ES2020 version)</em> instead of all the improvements introduced. For those who do not know, <strong>optional chaining is a functionality that allows us to safely access properties of objects in javascript, avoiding common errors such as <em>"Can not read property foo of undefined".</em></strong></p><p>Suppose we want to get the amount of apples from fruit objects has only bananas. Let's see what result we get with and without "optional chaining". I leave you an example</p><pre><code class="language-javascript">const fruits =  {
	bananas: {
        quantity: 12
    }
}

fruits.apples.quantity // ERROR: Cannot read property 'quantity' of undefined

// With optional chaining
fruits.apples?.quantity // undefined</code></pre><p>As I mentioned earlier, this functionality was introduced in ES11, but what alternatives were there before for this? \xA0Let's see some of them \u{1F680}</p><h2 id="optional-chaining-with-or-operator"><strong>"Optional chaining" with OR operator</strong></h2><p>As we know, javascript parentheses are used to evaluate an expression, so for the previous example we can check if "apple" exists in the fruits object before accessing the next property.</p><p>To do that we can use the OR operator like this.</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">(fruits.apples || {}).quantity // undefined</code></pre><figcaption>Safely access with OR operator</figcaption></figure><!--kg-card-begin: markdown--><p>In this example, the operator will return the value of apples if it isn't falsy value, otherwise <code>{}</code></p>
<!--kg-card-end: markdown--><!--kg-card-begin: markdown--><p>In other words, we have <code>(undefined || {}).quantity</code> literally, so it is safe to access &quot;quantity&quot; from an empty object and not from an <code>undefined</code> value.</p>
<!--kg-card-end: markdown--><h2 id="optional-chaining-with-and-operator"><strong>"Optional chaining" with AND operator</strong></h2><p>This is the most common option and perhaps the longest. Using the same example with the AND operator, it looks like this:</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">fruits.apples &amp;&amp; fruites.apples.quantity // undefined</code></pre><figcaption>Safely access with AND operator</figcaption></figure><h2 id="safely-access-to-properties-with-default-parameters"><strong>Safely access to properties with default parameters</strong></h2><p>If we want to safely access the property of an object through a function parameter, we can use the previous alternatives or use the default parameter (implemented in ES6).</p><p>I leave you an example:</p><pre><code class="language-javascript">const fruits =  {
	bananas: {
        quantity: 12
    }
}

const getFruitQuantity = (fruit = {}) =&gt; {
    return fruit.quantity
}

getFruitQuantity(fruits.apples) // undefined</code></pre><h2 id="useful-functions-for-more-complex-objects-"><strong>Useful functions for more complex objects.</strong></h2><p>With some of these alternatives <strong>we can build a function that helps us access more complex object properties.</strong> <br><br>Using the fruits object:</p><pre><code class="language-javascript">const fruits =  {
	bananas: {
        quantity: 12
    }
}</code></pre><p><br>I leave you some examples found on the net:</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">get = function(obj, key) {
    return key.split(".").reduce(function(o, x) {
        return (typeof o == "undefined" || o === null) ? o : o[x];
    }, obj);
}

/* Usage */
get(fruits, 'apples.quantity') // undefined</code></pre><figcaption><a href="https://newbedev.com/javascript-elegant-way-to-check-nested-object-properties-for-null-undefined">Click here to go to the source</a></figcaption></figure><figure class="kg-card kg-code-card"><pre><code class="language-javascript">const getNestedObject = (nestedObj, pathArr) =&gt; {
    return pathArr.reduce(
      (obj, key) =&gt; (obj &amp;&amp; obj[key] !== 'undefined' ? obj[key] : null),
      nestedObj
    );
};

/* Usage */
getNestedObject(fruits, ['apples', 'quantity']) // null</code></pre><figcaption><a href="https://gist.github.com/marcandrewb/1d5b4deaac541fc9c61c3f06f9555353">Click here to go to the source</a></figcaption></figure><h2 id="is-it-just-to-access-objects"><strong>Is it just to access objects?</strong></h2><p>Throughout this post, I have only mentioned the properties of objects, so does it work for objects only? </p><p>The answer is NO. \u{1F913}</p><p>We can use both the mentioned alternatives and the "optional chaining", to access elements of arrays or execute functions in a safe way. I leave you some examples:</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">const someObject = null

// OR operator
((someObject || {}).someFunction || function(){} )() // undefined

// AND operator
typeof someObject === 'object' &amp;&amp; typeof someObject.someFunction === 'function' &amp;&amp; someObject.someFunction() // undefined

// Optional Chaining
someObject?.someFunction?.()</code></pre><figcaption>Function Invocation</figcaption></figure><figure class="kg-card kg-code-card"><pre><code class="language-javascript">const someObject = null
const someArray = null

// OR operator
((someObject || {}).someArray || [])[0] // undefined

// AND operator
typeof someObject === 'object' &amp;&amp; typeof someObject.someArray === 'object' &amp;&amp; someObject.someArray[0] // undefined

// Optional Chaining
someObject?.someArray?.[0]</code></pre><figcaption>Array index.</figcaption></figure><h2 id="conclusion"><strong>Conclusion</strong></h2><p>As you can see of the three ways learned, the longest is with the AND operator, but none is as short as the "optional chaining".</p><p>These types of errors are common and frequent, so it is necessary to know how to handle and avoid them.</p><blockquote>If you find inconsistencies in the writing of this post or if on the contrary it is okay, please let me know in the comments section, English is not my native language but I try to express myself as best I can \u{1F917}</blockquote><p>Do you like <strong>microfrontends</strong> or have you heard of them? Be aware that I will talk about them soon</p>`,
        comment_id: "60eb0fac9b9799001eba3160",
        feature_image: "https://ghost.dartiles.dev/content/images/2021/07/Post-Covers.png",
        featured: false,
        visibility: "public",
        send_email_when_published: false,
        created_at: "2021-07-11T12:35:08.000-03:00",
        updated_at: "2021-07-11T21:09:06.000-03:00",
        published_at: "2021-07-11T20:02:01.000-03:00",
        custom_excerpt: "Learn a bit about safely access in Javascript and many ways to achieve it without optional chaining. Come, surely learn something new together. ",
        codeinjection_head: null,
        codeinjection_foot: null,
        custom_template: null,
        canonical_url: null,
        tags: [
          {
            id: "5f669a13e491f8001e550caa",
            name: "Javascript",
            slug: "javascript",
            description: null,
            feature_image: null,
            visibility: "public",
            og_image: null,
            og_title: null,
            og_description: null,
            twitter_image: null,
            twitter_title: null,
            twitter_description: null,
            meta_title: null,
            meta_description: null,
            codeinjection_head: null,
            codeinjection_foot: null,
            canonical_url: null,
            accent_color: null,
            url: "https://ghost.dartiles.dev/tag/javascript/"
          }
        ],
        authors: [
          {
            id: "1",
            name: "Diego Artiles",
            slug: "dartiles",
            profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
            cover_image: null,
            bio: null,
            website: null,
            location: null,
            facebook: null,
            twitter: null,
            meta_title: null,
            meta_description: null,
            url: "https://ghost.dartiles.dev/author/dartiles/"
          }
        ],
        primary_author: {
          id: "1",
          name: "Diego Artiles",
          slug: "dartiles",
          profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
          cover_image: null,
          bio: null,
          website: null,
          location: null,
          facebook: null,
          twitter: null,
          meta_title: null,
          meta_description: null,
          url: "https://ghost.dartiles.dev/author/dartiles/"
        },
        primary_tag: {
          id: "5f669a13e491f8001e550caa",
          name: "Javascript",
          slug: "javascript",
          description: null,
          feature_image: null,
          visibility: "public",
          og_image: null,
          og_title: null,
          og_description: null,
          twitter_image: null,
          twitter_title: null,
          twitter_description: null,
          meta_title: null,
          meta_description: null,
          codeinjection_head: null,
          codeinjection_foot: null,
          canonical_url: null,
          accent_color: null,
          url: "https://ghost.dartiles.dev/tag/javascript/"
        },
        url: "https://ghost.dartiles.dev/optional-chaining-without-es11-safely-access/",
        excerpt: "Learn a bit about safely access in Javascript and many ways to achieve it without optional chaining. Come, surely learn something new together. ",
        reading_time: 3,
        access: true,
        og_image: null,
        og_title: null,
        og_description: null,
        twitter_image: null,
        twitter_title: null,
        twitter_description: null,
        meta_title: null,
        meta_description: null,
        email_subject: null,
        createdAt: "2021-07-11T12:35:08.000-03:00",
        desc: "Learn a bit about safely access in Javascript and many ways to achieve it without optional chaining. Come, surely learn something new together. ",
        image: "media/blog/optional-chaining-without-es11-safely-access/optional-chaining-without-es11-safely-access.png"
      },
      {
        id: "5faf3f832e01b8001e3cbd76",
        uuid: "811ac63d-c41a-4816-a76f-3eba0786638e",
        title: "Cosas que quiz\xE1s no sab\xEDas de React",
        slug: "cosas-que-quizas-no-sabias-de-react",
        html: `<p>Alguna vez te has preguntando <strong>\xBFC\xF3mo funciona el m\xE9todo render de ReactDOM? \xBFPor qu\xE9 hay que importar React cada vez que creamos un componente? </strong> Esto y m\xE1s te ense\xF1are en este art\xEDculo. \u2764</p><h2 id="-c-mo-funciona-el-m-todo-render-de-reactdom">\xBFC\xF3mo funciona el m\xE9todo render de ReactDOM?</h2><p>Este m\xE9todo es similar a <strong>document.appendChild() </strong>la diferencia consiste en que <strong>ReactDOM </strong>nos permite "incrustar" elementos de <strong>React </strong>en un contenedor y con <strong>appendChild </strong>solo podemos hacerlo con elementos HTML.</p><!--kg-card-begin: markdown--><p>Otra de las diferencias que existen entre estos dos m\xE9todos, es que <strong>appendChild()</strong> hace un push del elemento al contenedor (lo que quiere decir que los elementos existentes se mantienen y se agrega uno nuevo), en cambio <strong>el render de React DOM reemplaza totalmente el contenido del contenedor</strong>, basicamente ser\xEDa un <code>container.innerHTML</code></p>
<!--kg-card-end: markdown--><p>Mencionado esto, podemos agregar un spinner en el contenedor donde se renderizar\xE1 nuestra aplicaci\xF3n y este desaparecer\xE1 autom\xE1ticamente en el montaje de la app \u{1F914}.</p><pre><code class="language-html">&lt;!DOCTYPE html&gt;
&lt;html lang="es"&gt;

&lt;head&gt;
	&lt;meta charset="UTF-8"&gt;
	&lt;meta name="viewport" content="width=, initial-scale="&gt;
	&lt;title&gt;Dartiles Dev&lt;/title&gt;
&lt;/head&gt;

&lt;body&gt;
	&lt;div id="root"&gt;
		&lt;p&gt;Este contenido ser\xE1 reemplazado por el m\xE9todo render de React DOM o se mantendr\xE1 si usamos el appendChild&lt;/p&gt;
	&lt;/div&gt;
&lt;/body&gt;

&lt;/html&gt;</code></pre><p>Suponiendo que tenemos este <strong>HTML</strong> podemos agregar contenido con <strong>appendChild</strong> y <strong>render.</strong></p><p>Veamos un ejemplo: </p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">const dartilesTitle = document.createElement("h1");

dartilesTitle.innerHTML = "Estas en dartiles.dev";

const container = document.getElementById("root");

container.appendChild(dartilesTitle);
</code></pre><figcaption>A\xF1adiendo un h1 a nuestro contenedor con <strong>appendChild</strong></figcaption></figure><figure class="kg-card kg-code-card"><pre><code class="language-jsx">import React from 'react'
import ReactDOM from 'react-dom'

const dartilesTitle = &lt;h1&gt;Est\xE1s en dartiles.dev&lt;/h1&gt;

const container = document.getElementById('root')

ReactDOM.render(dartilesTitle, container)</code></pre><figcaption>A\xF1adiendo un h1 a nuestro contenedor con <strong>ReactDOM</strong></figcaption></figure><p>Una forma de aprender a identificar el m\xE9todo render de ReactDOM es recordar que <strong>el primer par\xE1metro del m\xE9todo se refiere a que queremos renderizar,</strong> es decir, el elemento que queremos a\xF1adir, mientras que<strong> el segundo se refiere a donde a\xF1adirlo</strong>; en que contenedor.</p><!--kg-card-begin: html--><p>Te dejo un <a target="_blank" href="https://stackblitz.com/edit/cosas-que-no-sabias-de-react?file=src/index.js">link</a> en stackblitz con el <code>setTimeout</code> para que puedas observar lo que pasa con los dos m\xE9todos \u{1F601} </p><!--kg-card-end: html--><h2 id="-por-qu-hay-que-importar-react-cada-vez-que-creamos-un-componente">\xBFPor qu\xE9 hay que importar React cada vez que creamos un componente?</h2><!--kg-card-begin: markdown--><p>Como te habr\xE1s fijado en el ejemplo de React, hacemos un <code>import React from 'react'</code> pero aparentemente en ning\xFAn lado lo usamos y si comentamos esta linea ocurre un error que nos dice que <code>React is not defined</code></p>
<!--kg-card-end: markdown--><p>Entonces, <strong>\xBFPor qu\xE9 nos aparece este error si no estamos usando expl\xEDcitamente React?</strong> Bien para encontrar la respuesta a nuestra pregunta, primero debemos saber <strong>que pasa por detr\xE1s cuando escribimos c\xF3digo JSX.</strong></p><p>Cuando nosotros estamos escribiendo <strong>JSX </strong>(enti\xE9ndase jsx como el "html" dentro de javascript), al final babel est\xE1 transformando ese c\xF3digo a <strong>React.createElement()</strong>, ve\xE1moslo mucho mejor con un ejemplo:</p><pre><code class="language-jsx">/* ANTES DE LA COMPILACI\xD3N */

import React from 'react'

const dartilesContainer = &lt;div&gt;Est\xE1s en dartiles.dev&lt;/div&gt;

/* DESPU\xC9S DE LA COMPILACI\xD3N */

import React from 'react';

const dartilesContainer = React.createElement("div", null, "Est\xE1s en dartiles.dev"); 
// El c\xF3digo JSX desaparece y se convierte en React.createElement</code></pre><p>Es por eso que siempre necesitamos importar <strong>React </strong>al crear un componente o al utilizar c\xF3digo JSX, si bien es cierto hay frameworks como <strong>NextJS </strong>que hacen este trabajo por nosotros, en React no es as\xED, al menos en las versiones anteriores a la 17.</p><p>Si nos vamos m\xE1s a profundidad <strong>React.createElement </strong>crea un un objeto que contiene la informaci\xF3n que React va a leer para crear elementos en el DOM. Partiendo del ejemplo anterior, algunas propiedades principales del objeto resultante es el siguiente:</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">const dartilesContainer = {
    type: 'div',
    props: {
        children: 'Est\xE1s en dartiles.dev'
    }
}</code></pre><figcaption>Objeto resultante de <strong>React.createElement</strong></figcaption></figure><p>Como te podr\xE1s imaginar si tuvi\xE9ramos que escribir nuestro componentes con <strong>React.createElement</strong> directamente nuestros archivos crecer\xEDan dr\xE1sticamente, adem\xE1s de que se ser\xEDa engorroso trabajar con ellos. Es por eso que JSX existe, para simplificar nuestro c\xF3digo y hacernos m\xE1s f\xE1cil la vida a la hora de crear componentes con \xE9l.</p><h2 id="-cu-ndo-no-importar-react">\xBFCu\xE1ndo NO importar React?</h2><p>Muy probablemente hayas importado <strong>React </strong>al crear <strong>custom hooks, </strong>porque te acostumbraste que cada vez que creamos un nuevo archivo hab\xEDa que hacer esto y lo cierto es que no, solamente tienes que importarlo cuando veas c\xF3digo <strong>JSX</strong>; de igual forma no podr\xE1s olvidarte de hacerlo porque tu aplicaci\xF3n dar\xE1 error.</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">import { useState } from "react";

export const useHook = () =&gt; {
  const [state, setState] = useState("Est\xE1s en dartiles.dev");

  return [state, setState];
};
</code></pre><figcaption>Para este ejemplo NO es necesario importar, basta solamente con <strong>useState</strong></figcaption></figure><h2 id="-qu-es-el-virtual-dom">\xBFQu\xE9 es el Virtual DOM?</h2><p>Seguramente en tu proceso de aprendizaje de React habr\xE1s visto el t\xE9rmino "Virtual DOM", si est\xE1s un poco m\xE1s experimentado sabr\xE1s que DOM se refiere al <strong>Document Object Model,</strong> la API para representar documentos HTML/XML. </p><p>Ahora que sabemos que Virtual DOM y DOM son cosas distintas, llam\xE9moslo <strong>VDOM</strong> y <strong>DOM</strong> respectivamente.</p><p>La palabra Virtual sirve m\xE1s que nada para diferenciarlo del DOM, su funci\xF3n es crear un "bridge" o puente entre nuestra aplicaci\xF3n y el DOM, manteniendo el memoria el estado de la aplicaci\xF3n y una copia del DOM. </p><p>Gracias a que <strong>React mantiene en memoria el DOM</strong>, cada vez que se produzca un cambio en alg\xFAn componente se actualiza el VDOM, luego de eso se compara el VDOM anterior con el nuevo y la diferencia entre estas versiones es finalmente reflejada en el DOM. </p><p>Esto hace que se manipule \xFAnicamente las secciones que cambiaron y no todo el \xE1rbol del DOM, obteniendo as\xED mejor performance para nuestra aplicaci\xF3n.</p><!--kg-card-begin: markdown--><p><em><mark>Lo explicado anteriormente es similar a lo que hace <strong>git</strong>, detecta que partes cambiaron y los almacena, y al hacer el merge se unifican los cambios.</mark></em></p>
<!--kg-card-end: markdown--><p>Te dejo a continuaci\xF3n una imagen que encontr\xE9 por internet que te ayudar\xE1 a entender mucho mejor este concepto:</p><figure class="kg-card kg-image-card kg-card-hascaption"><img src="./media/blog/cosas-que-quizas-no-sabias-de-react/2020-11-image.png" loading="lazy" class="kg-image" alt srcset="./media/blog/cosas-que-quizas-no-sabias-de-react/size-w600-2020-11-image.png 600w, ./media/blog/cosas-que-quizas-no-sabias-de-react/2020-11-image.png 900w" sizes="(min-width: 720px) 720px"><figcaption>Representaci\xF3n gr\xE1fica del funcionamiento del VDOM. Fuente: https://www.cronj.com/</figcaption></figure><h2 id="conclusiones">Conclusiones</h2><p>Este es un resumen de cositas que quiz\xE1s no sab\xEDas, hay mucho m\xE1s y m\xE1s profundas \u{1F913}, te invito a decirme en los <strong>comentarios</strong> que crees que falto a\xF1adir en este art\xEDculo y <strong>compartir este art\xEDculo</strong> para los que est\xE1n inciando en el aprendizaje de React \u2764</p>`,
        comment_id: "5faf3f832e01b8001e3cbd76",
        feature_image: "https://ghost.dartiles.dev/content/images/2020/11/cosas-que-quizas-no-sabias-de-react.png",
        featured: false,
        visibility: "public",
        send_email_when_published: false,
        created_at: "2020-11-13T23:22:59.000-03:00",
        updated_at: "2020-11-23T18:56:11.000-03:00",
        published_at: "2020-11-22T10:48:19.000-03:00",
        custom_excerpt: "\xBFPor qu\xE9 siempre hay que importar React al crear nuestros componentes? \xBFQu\xE9 hace JSX por detr\xE1s? \xBFQu\xE9 es el Virtual DOM? Desc\xFAbrelo en este art\xEDculo \u2764",
        codeinjection_head: null,
        codeinjection_foot: null,
        custom_template: null,
        canonical_url: null,
        tags: [
          {
            id: "5f8ced9d62d1f8001edf372d",
            name: "React",
            slug: "react",
            description: null,
            feature_image: null,
            visibility: "public",
            og_image: null,
            og_title: null,
            og_description: null,
            twitter_image: null,
            twitter_title: null,
            twitter_description: null,
            meta_title: null,
            meta_description: null,
            codeinjection_head: null,
            codeinjection_foot: null,
            canonical_url: null,
            accent_color: null,
            url: "https://ghost.dartiles.dev/tag/react/"
          }
        ],
        authors: [
          {
            id: "1",
            name: "Diego Artiles",
            slug: "dartiles",
            profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
            cover_image: null,
            bio: null,
            website: null,
            location: null,
            facebook: null,
            twitter: null,
            meta_title: null,
            meta_description: null,
            url: "https://ghost.dartiles.dev/author/dartiles/"
          }
        ],
        primary_author: {
          id: "1",
          name: "Diego Artiles",
          slug: "dartiles",
          profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
          cover_image: null,
          bio: null,
          website: null,
          location: null,
          facebook: null,
          twitter: null,
          meta_title: null,
          meta_description: null,
          url: "https://ghost.dartiles.dev/author/dartiles/"
        },
        primary_tag: {
          id: "5f8ced9d62d1f8001edf372d",
          name: "React",
          slug: "react",
          description: null,
          feature_image: null,
          visibility: "public",
          og_image: null,
          og_title: null,
          og_description: null,
          twitter_image: null,
          twitter_title: null,
          twitter_description: null,
          meta_title: null,
          meta_description: null,
          codeinjection_head: null,
          codeinjection_foot: null,
          canonical_url: null,
          accent_color: null,
          url: "https://ghost.dartiles.dev/tag/react/"
        },
        url: "https://ghost.dartiles.dev/cosas-que-quizas-no-sabias-de-react/",
        excerpt: "\xBFPor qu\xE9 siempre hay que importar React al crear nuestros componentes? \xBFQu\xE9 hace JSX por detr\xE1s? \xBFQu\xE9 es el Virtual DOM? Desc\xFAbrelo en este art\xEDculo \u2764",
        reading_time: 4,
        access: true,
        og_image: null,
        og_title: null,
        og_description: null,
        twitter_image: null,
        twitter_title: null,
        twitter_description: null,
        meta_title: null,
        meta_description: "\xBFPor qu\xE9 siempre hay que importar React al crear nuestros componentes? \xBFQu\xE9 hace JSX por detr\xE1s? \xBFQu\xE9 es el Virtual DOM? Desc\xFAbrelo en este art\xEDculo \u2764",
        email_subject: null,
        createdAt: "2020-11-13T23:22:59.000-03:00",
        desc: "\xBFPor qu\xE9 siempre hay que importar React al crear nuestros componentes? \xBFQu\xE9 hace JSX por detr\xE1s? \xBFQu\xE9 es el Virtual DOM? Desc\xFAbrelo en este art\xEDculo \u2764",
        image: "media/blog/cosas-que-quizas-no-sabias-de-react/cosas-que-quizas-no-sabias-de-react.png"
      },
      {
        id: "5fa21994eadbac001ea7cacb",
        uuid: "6738ce95-d597-4101-b7b5-35e08ace98e8",
        title: "Escribe c\xF3digo JSX m\xE1s r\xE1pido - Como activar Emmet en React",
        slug: "escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react",
        html: '<!--kg-card-begin: markdown--><p>Si alguna vez usaste <strong>Emmet</strong> sabr\xE1s de que estoy hablando, para los que no lo conozcan <strong>son un conjunto de snippets que nos permite escribir c\xF3digo mucho m\xE1s r\xE1pido.</strong> Generalmente se suele usar en archivos <code>html</code> o <code>css</code> y sus preprocesadores.</p>\n<p>Sin embargo, soporta otros tipos de archivos o lenguajes que por defecto no est\xE1n habilitados. En este articulo te ense\xF1ar\xE9 a <strong>como activar emmet en archivos js/jsx desde Visual Studio Code</strong>.</p>\n<!--kg-card-end: markdown--><h2 id="escribiendo-componentes-con-y-sin-emmet"><strong>Escribiendo componentes con y sin Emmet</strong></h2><p>Para los que suelen ser m\xE1s visuales (como yo) les voy a mostrar que vamos a lograr con esto a trav\xE9s de algunos gifs que hice para ustedes \u{1F60E}</p><figure class="kg-card kg-image-card kg-card-hascaption"><img src="./media/blog/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react/2020-11-WithoutEmmet.gif" loading="lazy" class="kg-image" alt><figcaption>Escribiendo c\xF3digo JSX sin Emmet</figcaption></figure><figure class="kg-card kg-image-card kg-width-full kg-card-hascaption"><img src="./media/blog/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react/2020-11-WithEmmet.gif" loading="lazy" class="kg-image" alt><figcaption>Escribiendo c\xF3digo JSX con Emmet</figcaption></figure><h2 id="como-activar-emmet-para-nuestros-componentes-de-react"><strong>Como activar Emmet para nuestros componentes de React</strong></h2><p>Para agregar al soporte de <strong>Emmet </strong>en <strong>Visual Studio Code </strong>debemos ir a las configuraciones del usuario para eso hay muchas formas de llegar ah\xED, la m\xE1s conocida es ir al men\xFA principal <strong>(File &gt; Preferences &gt; Settings)</strong></p><!--kg-card-begin: markdown--><p>Otra opci\xF3n es acceder a las configuraciones del IDE con las combinaciones de teclas <code>ctrl</code> + <code>,</code> en Windows, desconozco el atajo para Mac pero tranquilo hay muchas formas de llegar hasta ac\xE1.</p>\n<p>Una vez ah\xED busquemos &quot;Emmet&quot; y luego vayamos a la secci\xF3n donde dice <strong>Emmet: Include Languagues</strong> y damos clic en el bot\xF3n <strong>Add Item</strong>, en la descripci\xF3n de este apartado tenemos un par de ejemplos para habilitar el soporte en otros tipos de archivos o lenguajes.</p>\n<p>Para activar el soporte para javascript debemos agregar como <strong>item</strong> <code>javascript</code> y como <strong>value</strong> <code>javascriptreact</code></p>\n<!--kg-card-end: markdown--><blockquote>Esta funcionalidad sirve tanto para archivos <strong>.js</strong> como para archivos <strong>.jsx</strong></blockquote><figure class="kg-card kg-image-card kg-width-full kg-card-hascaption"><img src="./media/blog/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react/2020-11-ActivateEmmet.gif" loading="lazy" class="kg-image" alt><figcaption>Activando el soporte de Emmet en los configuraciones del usuario</figcaption></figure><!--kg-card-begin: markdown--><p>Si preferimos editar las configuraciones desde el formato JSON, podemos presionar las teclas <code>ctrl</code> + <code>shift</code> + <code>p</code>, escribimos <strong>settings</strong> y seleccionamos la opci\xF3n que trae entre par\xE9ntesis <strong>JSON</strong>, se nos abrir\xE1 un JSON en el cual debemos agregar un key m\xE1s que se llame <strong>emmet.includeLanguages</strong>; \xE9ste ser\xE1 un objeto con una key llamada <code>javascript</code> cuyo value debe ser <code>javascriptreact</code></p>\n<!--kg-card-end: markdown--><figure class="kg-card kg-image-card kg-width-full kg-card-hascaption"><img src="./media/blog/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react/2020-11-ActivateEmmet2.gif" loading="lazy" class="kg-image" alt><figcaption>Activando el soporte de Emmet en los configuraciones del usuario (JSON)</figcaption></figure><p>Una vez hecho cualquiera de estas opciones, no hace falta reiniciar nuestro editor podemos ir a nuestro archivo de javascript y podemos escribir JSX m\xE1s r\xE1pido.</p><p>Adem\xE1s de escribir elementos de html comunes y corrientes, tambi\xE9n podemos <strong>escribir componentes de React</strong>. Te dejo un peque\xF1o ejemplo: </p><figure class="kg-card kg-image-card kg-width-wide kg-card-hascaption"><img src="./media/blog/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react/2020-11-Emmet-Components.gif" loading="lazy" class="kg-image" alt><figcaption>Escribiendo componentes de React con Emmet</figcaption></figure><h2 id="conclusiones"><strong>Conclusiones</strong></h2><!--kg-card-begin: html--><p>Emmet tiene un mont\xF3n de configuraciones y opciones que en este art\xEDculo no explicar\xE9, pero si quer\xEDa dejarles saber que pueden explorarlas una a una a trav\xE9s de este <a href="https://code.visualstudio.com/docs/editor/emmet" target="_blank" rel="nofollow noopener noreferrer">link</a>.<p><!--kg-card-end: html--><p>Much\xEDsimas gracias por llegar hasta ac\xE1, espero que hayas aprendido algo nuevo y si te gustan este tipo de material d\xE9jamelo saber en los <strong>comentarios </strong>\u2764\u2764</p>',
        comment_id: "5fa21994eadbac001ea7cacb",
        feature_image: "https://ghost.dartiles.dev/content/images/2020/11/carbon.png",
        featured: false,
        visibility: "public",
        send_email_when_published: false,
        created_at: "2020-11-04T00:01:40.000-03:00",
        updated_at: "2020-11-05T22:07:06.000-03:00",
        published_at: "2020-11-04T00:03:59.000-03:00",
        custom_excerpt: "Descubre como escribir tus componentes en React mucho m\xE1s r\xE1pido con Emmet \u{1F92F}",
        codeinjection_head: null,
        codeinjection_foot: null,
        custom_template: null,
        canonical_url: null,
        tags: [
          {
            id: "5f8ced9d62d1f8001edf372d",
            name: "React",
            slug: "react",
            description: null,
            feature_image: null,
            visibility: "public",
            og_image: null,
            og_title: null,
            og_description: null,
            twitter_image: null,
            twitter_title: null,
            twitter_description: null,
            meta_title: null,
            meta_description: null,
            codeinjection_head: null,
            codeinjection_foot: null,
            canonical_url: null,
            accent_color: null,
            url: "https://ghost.dartiles.dev/tag/react/"
          }
        ],
        authors: [
          {
            id: "1",
            name: "Diego Artiles",
            slug: "dartiles",
            profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
            cover_image: null,
            bio: null,
            website: null,
            location: null,
            facebook: null,
            twitter: null,
            meta_title: null,
            meta_description: null,
            url: "https://ghost.dartiles.dev/author/dartiles/"
          }
        ],
        primary_author: {
          id: "1",
          name: "Diego Artiles",
          slug: "dartiles",
          profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
          cover_image: null,
          bio: null,
          website: null,
          location: null,
          facebook: null,
          twitter: null,
          meta_title: null,
          meta_description: null,
          url: "https://ghost.dartiles.dev/author/dartiles/"
        },
        primary_tag: {
          id: "5f8ced9d62d1f8001edf372d",
          name: "React",
          slug: "react",
          description: null,
          feature_image: null,
          visibility: "public",
          og_image: null,
          og_title: null,
          og_description: null,
          twitter_image: null,
          twitter_title: null,
          twitter_description: null,
          meta_title: null,
          meta_description: null,
          codeinjection_head: null,
          codeinjection_foot: null,
          canonical_url: null,
          accent_color: null,
          url: "https://ghost.dartiles.dev/tag/react/"
        },
        url: "https://ghost.dartiles.dev/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react/",
        excerpt: "Descubre como escribir tus componentes en React mucho m\xE1s r\xE1pido con Emmet \u{1F92F}",
        reading_time: 3,
        access: true,
        og_image: null,
        og_title: null,
        og_description: null,
        twitter_image: null,
        twitter_title: null,
        twitter_description: null,
        meta_title: null,
        meta_description: "Descubre como escribir tus componentes en React mucho m\xE1s r\xE1pido con Emmet \u{1F92F}",
        email_subject: null,
        createdAt: "2020-11-04T00:01:40.000-03:00",
        desc: "Descubre como escribir tus componentes en React mucho m\xE1s r\xE1pido con Emmet \u{1F92F}",
        image: "media/blog/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react.png"
      },
      {
        id: "5f98b578e67152001e735162",
        uuid: "1572f496-62b4-4194-8419-3a8c5b7b164d",
        title: "useEffect, el hook de efecto de React - Ciclos de vidas en componentes funcionales",
        slug: "useeffect-react-hooks-ciclos-de-vida",
        html: `<!--kg-card-begin: html--><p>Adem\xE1s del useState, el hook useEffect es uno de los m\xE1s usados en React. Anteriormente ya explicamos <a href="https://dartiles.dev/blog/como-funciona-el-hook-usestate-y-como-usarlos-con-arrays-y-objetos" target="_blank">como funciona el useState y como usarlo con arrays y objetos</a>, y ahora es el momento de este hook \u{1F917}</p><!--kg-card-end: html--><h2 id="ciclos-de-vidas-en-componentes-funcionales"><strong>Ciclos de vidas en componentes funcionales</strong></h2><p>Antes en React (versiones inferiores a la 16.8) dispon\xEDamos de varias funciones heredadas de la clase Component, que nos permit\xEDan acceder a diferentes momentos del ciclo de vida de nuestro componente (montaje, actualizaci\xF3n y desmontaje) .</p><p>Ahora con la llegada de este hook, se pueden acceder a los eventos m\xE1s usados desde una \xFAnica funci\xF3n, tales son <code>componentDidMount</code>, <code>componentDidUpdate</code> y <code>componentWillUnmount</code></p><h2 id="-c-mo-se-usa-el-useeffect"><strong>\xBFC\xF3mo se usa el useEffect?</strong></h2><p>Como bien les cont\xE9, el useEffect unifica 3 m\xE9todos asociados al ciclo de vida de nuestro componente, as\xED que \xBFC\xF3mo diferenciamos cada uno de estos m\xE9todos?</p><p>Este hook al igual que todos son funciones, y en este caso recibe dos par\xE1metros, el primero corresponde a un callback o funci\xF3n y el segundo un arreglo de dependencias.</p><p>El callback no recibe ning\xFAn par\xE1metro solamente nos sirve para ejecutar c\xF3digo en el momento de que se produzca el efecto deseado.</p><p>Por otro lado, el segundo par\xE1metro es opcional y dependiendo de su valor el efecto se ejecutar\xE1.</p><pre><code class="language-javascript">import React, { useEffect } from 'react'

useEffect(() =&gt; { /* Your code here... */ });</code></pre><h2 id="momentos-de-ejecuci-n-seg-n-el-valor-del-segundo-par-metro-del-useeffect"><strong>Momentos de ejecuci\xF3n seg\xFAn el valor del segundo par\xE1metro del useEffect</strong></h2><p>Pasemos a descubrir los 3 posibles casos en los que se puede ejecutar este hook seg\xFAn el valor del segundo par\xE1metro. \u{1F913}</p><!--kg-card-begin: markdown--><ul>
<li>
<p><strong>Sin valor</strong>: cuando omitimos este par\xE1metro, el efecto se producir\xE1 en el primer renderizado y en cada uno de los subsecuentes (cuando se produce un cambio de estado o las props cambian). Podemos decir que en este caso est\xE1n combinados los m\xE9todos <code>componentDidMount</code> y <code>componentDidUpdate</code></p>
</li>
<li>
<p><strong>Arreglo vac\xEDo [ ]</strong>: cuando le pasamos este valor, el efecto se producir\xE1 <strong>\xFAnicamente</strong> en el primer renderizado y es equivalente al m\xE9todo <code>componentDidMount</code>. Y esto es debido a que el efecto se produce siempre y cuando el valor dentro del arreglo [ ] cambie, y como en este caso al no recibir nada, React ejecuta el efecto una \xFAnica vez.</p>
</li>
<li>
<p><strong>Arreglo con dependencias</strong>: los posibles valores de este arreglo pueden ser variables asociadas a un <strong>estado</strong> o <strong>props</strong> del componente, seg\xFAn sea el caso el hook se ejecutar\xE1 cada vez que su(s) dependencia(s) cambie(n).</p>
<p>Podemos pasar la cantidad de dependencias que queramos, pero realmente no es muy recomendado (m\xE1s que nada por razones de performance) y se opta por usar varios <code>useEffect</code> con diferentes dependencias.</p>
<p>Este caso es similar al m\xE9todo <code>componentDidUpdate</code>, a excepci\xF3n de que s\xF3lo se ejecutar\xE1 cuando las dependendencias cambien y no ante cada cambio o reenderizado como si ocurre con este m\xE9todo de las componentes de clases.</p>
</li>
</ul>
<!--kg-card-end: markdown--><p>Como te habr\xE1s dado cuenta no mencion\xE9 el m\xE9todo <code>componentWillUnmount</code>, y es porque no solamente tiene que ver con el valor del segundo par\xE1metro del <code>useEffect</code>, si no que hace falta unos peque\xF1os detalles que ya te contar\xE9 \u{1F608}</p><!--kg-card-begin: markdown--><p>A continuaci\xF3n te dejo las comparaciones de <code>componentDidMount</code>, <code>componentDidUpdate</code>, <code>componentWillUnmount</code> con el <code>useEffect</code></p>
<!--kg-card-end: markdown--><h2 id="ciclos-de-vida-en-componentes-de-tipo-clase-vs-componentes-de-tipo-funci-n"><strong>Ciclos de vida en componentes de tipo clase vs componentes de tipo funci\xF3n</strong></h2><p>Si llevas mucho tiempo trabajando con los componentes de clases, te servir\xE1 mucho esta informaci\xF3n para saber las equivalencias de los m\xE9todos antes mencionados y su uso a trav\xE9s del useEffect.</p><h3 id="componentdidmount">componentDidMount</h3><p>Si nos vamos a la traducci\xF3n literal del nombre de este m\xE9todo al espa\xF1ol es "El componente se mont\xF3", y s\xED, este es el preciso momento en el que se ejecuta este m\xE9todo, justo y \xFAnicamente luego de hacer el <strong>primer renderizado </strong>del componente.</p><p>Podemos decir que hace la misma funci\xF3n que el m\xE9todo <code>OnInit</code> de Angular \u{1F60E}</p><p>Bien, pasemos a como se accede a este momento del ciclo de vida con componentes de clases y como lo har\xEDamos con los componentes funcionales</p><figure class="kg-card kg-code-card"><pre><code class="language-jsx">import React from "react";
class App extends React.Component {
  state = { name: "Diego" };

  componentDidMount() { // M\xE9todo ejecutado en el primer renderizado
    console.log("Se inicializ\xF3 el componente por primera vez");
  }

  render() {
    return &lt;h1&gt;Mi nombre es {this.state.name}&lt;/h1&gt;;
  }
}
export default App;
</code></pre><figcaption>Accediendo al momento del primer renderizado con componentes de clase</figcaption></figure><figure class="kg-card kg-code-card"><pre><code class="language-jsx">import React, { useEffect, useState } from "react";

const App = () =&gt; {
  const [state] = useState({ name: "Diego" });
    
  useEffect(() =&gt; {
    console.log("Se inicializ\xF3 el componente por primera vez");
  }, []); // M\xE9todo ejecutado en el primer renderizado
    
  return &lt;h1&gt; Hello {state.mensaje}&lt;/h1&gt;;
};

export default App;
</code></pre><figcaption>Accediendo al momento del primer renderizado con componentes funcionales</figcaption></figure><p>Como ver\xE1n el segundo par\xE1metro de este hook juega un papel muy importante para decidir cuando se ejecutar\xE1 el efecto, tal cual como mencion\xE9 anteriormente en el caso de querer ejecutar c\xF3digo al momento del primer renderizado, basta con pasarle un array vac\xEDo al segundo par\xE1metro \u{1F601}</p><blockquote>Enti\xE9ndase <strong>primer renderizado </strong>como el momento justo cuando React monta un componente en el DOM, es decir, cuando nosotros veamos nuestro componente en el DOM, posteriormente se ejecutar\xE1 por <strong>\xFAnica vez</strong> el efecto.</blockquote><h3 id="componentdidupdate">componentDidUpdate</h3><p>Su traducci\xF3n literal al espa\xF1ol es "el componente se actualiz\xF3", creo que el nombre se explica por si solo.</p><!--kg-card-begin: markdown--><p>Este m\xE9todo se ejecutar\xE1 cada vez que se produzca un cambio de estado o de props e independientemente de a quien pertenezca el cambio, es decir, no importa si cambio una <code>prop</code> o un <code>state</code> sea cual sea el caso se ejecutar\xE1 este m\xE9todo.</p>
<p>Si nos vamos a Angular este m\xE9todo es similar a <code>OnChanges</code> \u{1F60E}</p>
<p>Compar\xE9moslo con el <code>useEffect</code></p>
<!--kg-card-end: markdown--><p>Supongamos que queremos registrar la cantidad de veces que ha sido presionado un bot\xF3n ante cada cambio:</p><figure class="kg-card kg-code-card"><pre><code class="language-jsx">import React from "react";

class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clicks: 0
    };
  }

  componentDidUpdate() {
    // Ante cada cambio mostramos por consola la cantidad de veces que ha sido presionado el boton
    console.log(
      "Cantidad de veces que ha sido presionado el bot\xF3n:",
      this.state.clicks
    );
  }

  render() {
    return (
      &lt;div&gt;
        &lt;p&gt;Este bot\xF3n ha sido presionado {this.state.clicks} vece(s)&lt;/p&gt;
        &lt;button
          onClick={() =&gt; this.setState({ clicks: this.state.clicks + 1 })}
        &gt;
          Presioname
        &lt;/button&gt;
      &lt;/div&gt;
    );
  }
}

export default Counter;</code></pre><figcaption>Usando los eventos de las clases en React</figcaption></figure><figure class="kg-card kg-code-card"><pre><code class="language-jsx">import React, { useState, useEffect } from "react";

const Counter = () =&gt; {
  const [state, setState] = useState({ clicks: 0 });

  useEffect(() =&gt; {
    console.log(
      "Cantidad de veces que ha sido presionado el bot\xF3n:",
      state.clicks
    );
  });

  return (
    &lt;div&gt;
      &lt;p&gt;Este bot\xF3n ha sido presionado {state.clicks} vece(s)&lt;/p&gt;
      &lt;button onClick={() =&gt; setState({ clicks: state.clicks + 1 })}&gt;
        Presioname
      &lt;/button&gt;
    &lt;/div&gt;
  );
};

export default Counter;</code></pre><figcaption>Usando los hooks useState y useEffect</figcaption></figure><p>A nivel funcional encontramos una peque\xF1a diferencia, como les coment\xE9 anteriormente cuando el useEffect no tiene dependencia se est\xE1n ejecutando los m\xE9todos <code>componentDidMount</code> y <code>componentDidUpdate</code>, por lo cual, en el ejemplo del useEffect tendremos que en el primer renderizado veremos el log en la consola.</p><p>Pero este es un detalle menor, lo realmente interesante es cuando queramos registrar por consola solamente cuando cambie la cantidad de clicks, ya que el c\xF3digo que tenemos ahora provocar\xE1 que se registre ese evento sin importar en donde se produjo el cambio, sean props o estados.</p><p>Veamos un ejemplo de como solucionar esto, agregando un bot\xF3n "B" y registrando \xFAnicamente en consola cuando el bot\xF3n "A" sea presionado. \u{1F64A}</p><pre><code class="language-jsx">class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { clicksA: 0, clicksB: 0 };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.clicksA !== this.state.clicksA) {
    console.log(
      "Cantidad de veces que ha sido presionado el bot\xF3n A:",
      this.state.clicksA
    );
    }
  }

  render() {
    return (
    &lt;div&gt;
      &lt;button
        onClick={() =&gt; this.setState({ ...this.state, clicksA: this.state.clicksA + 1 })}
      &gt;
        Boton A
      &lt;/button&gt;
      &lt;button
        onClick={() =&gt; this.setState({ ...this.state, clicksB: this.state.clicksB + 1 })}
      &gt;
        Boton B
      &lt;/button&gt;
    &lt;/div&gt;
    );
  }
}

export default Counter;</code></pre><pre><code class="language-jsx">const Counter = () =&gt; {
  const [state, setState] = useState({ clicksA: 0, clicksB: 0 });

  useEffect(() =&gt; {
    console.log(
      "Cantidad de veces que ha sido presionado el bot\xF3n A:",
      state.clicksA
    );
  }, [state.clicksA]);

  return (
    &lt;div&gt;
      &lt;button
        onClick={() =&gt; setState({ ...state, clicksA: state.clicksA + 1 })}
      &gt;
        Boton A
      &lt;/button&gt;
      &lt;button
        onClick={() =&gt; setState({ ...state, clicksB: state.clicksB + 1 })}
      &gt;
        Boton B
      &lt;/button&gt;
    &lt;/div&gt;
  );
};

export default Counter;</code></pre><!--kg-card-begin: markdown--><p>Como podr\xE1n observar en las componentes de clases tenemos que hacer una diferenciaci\xF3n explicita para decidir cuando registrar en consola las veces que el bot\xF3n A ha sido presionado a diferencia del useEffect que solo basta con pasarle como dependencia el <code>state.clicksA</code>.</p>
<p>Otra diferencia que existe, es que el <code>useEffect</code> lo podemos usar cuantas veces querramos y el <code>componentDidUpdate</code> solo una vez y todos los cambios pasaran por ese m\xE9todo.</p>
<!--kg-card-end: markdown--><p>Si a\xFAn llegando hasta ac\xE1 te quedan dudas sobre el funcionamiento y las diferencias de este evento, puedes hac\xE9rmelo saber en los comentarios \u{1F60A}</p><h3 id="componentwillunmount">componentWillUnmount</h3><p>Bien hasta ahora no hemos explicado la equivalencia de este m\xE9todo con este hook, antes de explicarlo vayamos a la traducci\xF3n literal al espa\xF1ol para saber cuando se ejecuta este evento \u{1F601}, tenemos entonces "El componente se desmontar\xE1", esto quiere decir que el m\xE9todo se ejecutar\xE1 justo antes de desmontarse del DOM.</p><p>La equivalencia en Angular ser\xEDa <code>OnDestroy</code> \u{1F60E}</p><!--kg-card-begin: markdown--><p>Uno de los casos m\xE1s \xFAtiles por la que solemos usar este evento, es para cancelar alguna suscripci\xF3n, para ello supongamos que tenemos en nuestro componente un <code>setInterval</code> que hace &quot;algo&quot; y queremos limpiarlo antes de que nuestro componente se desmonte.</p>
<!--kg-card-end: markdown--><pre><code class="language-jsx">import React from "react";

class Interval extends React.Component {
  constructor(props) {
    super(props);
    this.interval;
  }

  componentDidMount() { // Inicializamos el interval al montarse el componente
    this.interval = setInterval(() =&gt; console.log("Algo estoy haciendo"), 1000);
  }

  componentWillUnmount() { //Eliminamos el interval justo antes de desmontarse el componente
    clearInterval(this.interval);
  }

  render() {
    return &lt;p&gt;Componente Interval&lt;/p&gt;;
  }
}

export default Interval;
</code></pre><pre><code class="language-jsx">import React, { useEffect } from "react";

const Interval = () =&gt; {
  useEffect(() =&gt; {
    const interval = setInterval( () =&gt; console.log("Algo estoy haciendo"), 1000); // Inicializamos el interval al montarse el componente
    return () =&gt; clearInterval(interval); //Eliminamos el interval justo antes de desmontarse el componente
  }, []);

  return &lt;p&gt;Componente Interval&lt;/p&gt;;
};

export default Interval;</code></pre><!--kg-card-begin: markdown--><p>Como podr\xE1n observar dentro del callback del <code>useEffect</code>, estamos retornando adem\xE1s otra funci\xF3n, esta funci\xF3n nos permite ejecutar c\xF3digo justo antes de que el componente se desmonte.</p>
<!--kg-card-end: markdown--><blockquote>Para acceder al m\xE9todo <strong>componentWillUnmount </strong>desde el <strong>useEffect, </strong>adem\xE1s de retornar una funci\xF3n, la dependencia debe ser un arreglo vac\xEDo [ ].</blockquote><p>Es de buena pr\xE1ctica, eliminar cualquier tipo de evento asincr\xF3nico antes de desmontar el componente a fin de mejorar el performance y evitar cualquier problema de volcado de memoria y bugs.</p><h2 id="conclusiones"><strong>Conclusiones</strong></h2><p>Bien en resumen, el useEffect es una nueva manera de acceder a los ciclos de vidas de nuestros componentes funcionales e incluso nos permite usar menos l\xEDneas de c\xF3digo \u{1F913}. \xBFTe gust\xF3 este post? \xBFAprendiste algo nuevo? \xBFTienes alguna duda? \xBFQuieres que explique algo en particular? H\xE1zmelo saber en la secci\xF3n de comentarios y recuerda seguirme en mis redes sociales \u{1F622} </p><p>Gracias por leer \u{1F61A}</p>`,
        comment_id: "5f98b578e67152001e735162",
        feature_image: "https://ghost.dartiles.dev/content/images/2020/10/useEffect.jpg",
        featured: false,
        visibility: "public",
        send_email_when_published: false,
        created_at: "2020-10-27T21:04:08.000-03:00",
        updated_at: "2020-10-31T14:08:49.000-03:00",
        published_at: "2020-10-31T13:00:00.000-03:00",
        custom_excerpt: null,
        codeinjection_head: null,
        codeinjection_foot: null,
        custom_template: null,
        canonical_url: null,
        tags: [
          {
            id: "5f8ced9d62d1f8001edf372d",
            name: "React",
            slug: "react",
            description: null,
            feature_image: null,
            visibility: "public",
            og_image: null,
            og_title: null,
            og_description: null,
            twitter_image: null,
            twitter_title: null,
            twitter_description: null,
            meta_title: null,
            meta_description: null,
            codeinjection_head: null,
            codeinjection_foot: null,
            canonical_url: null,
            accent_color: null,
            url: "https://ghost.dartiles.dev/tag/react/"
          }
        ],
        authors: [
          {
            id: "1",
            name: "Diego Artiles",
            slug: "dartiles",
            profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
            cover_image: null,
            bio: null,
            website: null,
            location: null,
            facebook: null,
            twitter: null,
            meta_title: null,
            meta_description: null,
            url: "https://ghost.dartiles.dev/author/dartiles/"
          }
        ],
        primary_author: {
          id: "1",
          name: "Diego Artiles",
          slug: "dartiles",
          profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
          cover_image: null,
          bio: null,
          website: null,
          location: null,
          facebook: null,
          twitter: null,
          meta_title: null,
          meta_description: null,
          url: "https://ghost.dartiles.dev/author/dartiles/"
        },
        primary_tag: {
          id: "5f8ced9d62d1f8001edf372d",
          name: "React",
          slug: "react",
          description: null,
          feature_image: null,
          visibility: "public",
          og_image: null,
          og_title: null,
          og_description: null,
          twitter_image: null,
          twitter_title: null,
          twitter_description: null,
          meta_title: null,
          meta_description: null,
          codeinjection_head: null,
          codeinjection_foot: null,
          canonical_url: null,
          accent_color: null,
          url: "https://ghost.dartiles.dev/tag/react/"
        },
        url: "https://ghost.dartiles.dev/useeffect-react-hooks-ciclos-de-vida/",
        excerpt: "Adem\xE1s del useState, el hook useEffect es uno de los m\xE1s usados en React.\nAnteriormente ya explicamos como funciona el useState y como usarlo con arrays\ny\nobjetos\n[https://dartiles.dev/blog/como-funciona-el-hook-usestate-y-como-usarlos-con-arrays-y-objetos]\n, y ahora es el momento de este hook \u{1F917}\n\nCiclos de vidas en componentes funcionales\nAntes en React (versiones inferiores a la 16.8) dispon\xEDamos de varias funciones\nheredadas de la clase Component, que nos permit\xEDan acceder a diferentes moment",
        reading_time: 7,
        access: true,
        og_image: null,
        og_title: null,
        og_description: null,
        twitter_image: null,
        twitter_title: null,
        twitter_description: null,
        meta_title: null,
        meta_description: "Descubre como acceder a los ciclos de vida de los componentes funcionales, como usar el hook useEffect de React y su equivalencia a los componentes de clases \u{1F496}",
        email_subject: null,
        createdAt: "2020-10-27T21:04:08.000-03:00",
        desc: "Adem\xE1s del useState, el hook useEffect es uno de los m\xE1s usados en React.\nAnteriormente ya explicamos como funciona el useState y como usarlo con arrays\ny\nobjetos\n[https://dartiles.dev/blog/como-funciona-el-hook-usestate-y-como-usarlos-con-arrays-y-objetos]\n, y ahora es el momento de este hook \u{1F917}\n\nCiclos de vidas en componentes funcionales\nAntes en React (versiones inferiores a la 16.8) dispon\xEDamos de varias funciones\nheredadas de la clase Component, que nos permit\xEDan acceder a diferentes moment",
        image: "media/blog/useeffect-react-hooks-ciclos-de-vida/useeffect-react-hooks-ciclos-de-vida.png"
      },
      {
        id: "5f8cc893966885001e79d750",
        uuid: "ed8284a3-8b5e-4a44-aa16-cfff0adba9b8",
        title: "Como funciona el hook useState y como usarlos con Arrays y Objetos",
        slug: "como-funciona-el-hook-usestate-y-como-usarlos-con-arrays-y-objetos",
        html: `<p>En este art\xEDculo te voy a explicar que es y para que sirve el hook <strong>useState </strong>de React, adem\xE1s de los distintos usos que le podemos dar.</p><h2 id="-qu-son-los-hooks-de-react"><strong>\xBFQu\xE9 son los hooks de React?</strong></h2><p>Los hooks son funciones que se "atan" o "enganchan" a los componente de tipo funci\xF3n (componentes funcionales) y nos aportan muchas de las caracter\xEDsticas que ten\xEDamos en las componentes de tipo clase. </p><p>Estas funciones se introdujeron en la versi\xF3n <strong>16.8</strong> de React, por ende, antes de utilizarlos aseg\xFArate de tener esta versi\xF3n o posterior.</p><h2 id="para-que-sirve-el-hook-usestate"><strong>Para que sirve el hook useState</strong></h2><p>El hook useState sirve para almacenar un estado a trav\xE9s de una variable en nuestro componente. </p><h2 id="-c-mo-se-usa-el-usestate"><strong>\xBFC\xF3mo se usa el useState?</strong></h2><p>Como les hab\xEDa comentado, los hooks son funciones los cuales reciben un par\xE1metro que representa el valor por defecto que tendr\xE1 nuestro estado y retorna un arreglo de dos elementos, el primer elemento contiene el estado actual y el segundo una funci\xF3n para modificar dicho estado.</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">import React, { useState } from "react"; // Importamos useState desde 'react'

const App = () =&gt; {
  const state = useState("default value"); // Valor inicial del estado
  const stateValue = state[0]; // El primer elemento es el valor del estado
  const setStateValue = state[1]; // El segundo elemento es la funci\xF3n que utilizaremos para actualizar el estado

  // A continuaci\xF3n mostramos el valor del estado y lo cambiamos a 'Another value' al hacer clic en el elemento div
  return &lt;div onClick={() =&gt; setStateValue('Another value')}&gt;{stateValue}&lt;/div&gt;;
};

export default App;
</code></pre><figcaption>Manera larga de declarar estos estados</figcaption></figure><p>Si bien es cierto, no es la mejor forma de declarar el estado y su actualizador en variables separadas, si que es m\xE1s f\xE1cil de entender \u{1F468}\u200D\u{1F4BB}</p><p>Pero la forma que se suele utilizar y la m\xE1s corta para declararlas, es la siguiente:</p><pre><code class="language-javascript">const [stateValue, setStateValue] = useState("default value");</code></pre><p>Con la l\xEDnea anterior obtenemos el mismo resultado, pero utilizando menos l\xEDneas de c\xF3digo. Si acostumbras a trabajar con el menor c\xF3digo posible esta forma te gustar\xE1 \u{1F601}</p><p>En este caso yo inicialice el estado con un <em>string </em>pero podemos usar cualquier tipo de valor como por ejemplo:</p><ul><li>Arreglos</li><li>Objetos</li><li>Booleanos</li><li>Strings</li></ul><p>Y en este art\xEDculo te mostrar\xE9 ejemplos con Arreglos y Objetos \u{1F61C}</p><h2 id="usar-arreglos-o-arrays-en-usestate"><strong>Usar Arreglos o Arrays en useState</strong></h2><p>Aqu\xED hay una particularidad con este tipo de datos y el hook useState que ya les ir\xE9 contando.</p><p>Primero declaramos nuestros useState con Arreglos, en este caso yo usar\xE9 el ejemplo de un array que contenga nombre de frutas:</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">const [fruits, setFruits] = useState(['Banana', 'Fresa', 'Durazno']);</code></pre><figcaption>Declarando el estado</figcaption></figure><p>Si quisi\xE9ramos agregar el nombre de otra fruta a esta lista, seguramente est\xE9s pensando en usar el m\xE9todo <strong>push(), </strong>pero lamentablemente no nos servir\xE1 y antes de explicarte porque, te muestro como har\xEDamos ese cambio de estado:</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">  fruits.push('Manzana') // Opci\xF3n 1
  setFruits(fruits.push('Manzana')) // Opci\xF3n 2</code></pre><figcaption>Intentando agregar una fruta a nuestra lista usando el m\xE9todo push del array</figcaption></figure><p>Si intentaste esto alguna vez seguramente te diste cuenta que no funcion\xF3 del todo bien, y esto es debido a las siguientes razones: </p><ul><li>La variable <strong>fruits</strong> es inmutable (no se puede modificar), por eso tiene su funci\xF3n "actualizadora" (Opci\xF3n 1)</li><li>Utilizar el m\xE9todo <strong>push </strong>dentro de la funci\xF3n <strong>setFruits </strong>tampoco funciona, porque si repasamos la teor\xEDa nos daremos cuenta que este m\xE9todo a pesar de agregar un nuevo elemento a un array lo que retorna es el <strong>length </strong>del array resultante y esto es lo que estar\xEDa recibiendo <strong>setFruits, </strong>que en nuestro caso es 4, es por eso que el nuevo valor de nuestro estado es 4 (Opci\xF3n 2).</li></ul><h3 id="formas-de-actualizar-un-array-en-usestate">Formas de actualizar un array en useState</h3><p>Antes de explicar cual es la manera correcta de modificar el valor de este elemento, tenemos que saber que la funci\xF3n actualizadora (setFruits en nuestro caso) puede recibir una funci\xF3n que tiene como \xFAnico par\xE1metro el valor actual del estado y retornar el nuevo valor del mismo. Seguramente al momento de leer esto se te venga a la cabeza como actualizar nuestro estado \u{1F600}, veamos si coincidimos:</p><p>Usando el m\xE9todo <strong>concat(), </strong>podemos actualizar nuestro estado seg\xFAn las dos formas aprendidas: usando la funci\xF3n interna de la funci\xF3n actualizadora o pasando directamente el valor nuevo a la funci\xF3n actualizadora.<br><br>Dejo a continuaci\xF3n un ejemplo con ambas opciones:</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">setFruits(currentFruits =&gt; currentFruits.concat('Manzana')) // Opci\xF3n 1
setFruits(fruits.concat('Manzana')) // Opci\xF3n 2

// Ambas opciones son validas</code></pre><figcaption>Actualizando nuestra lista de fruta con el m\xE9todo concat()</figcaption></figure><p>La funci\xF3n interna de <strong>setFruits </strong>puede ser \xFAtil cuando queramos desarrollar cierta l\xF3gica antes de definir el nuevo valor, pero particularmente no lo suelo hacer, primero preparo el valor nuevo en una variable y se lo paso a <strong>setFruits </strong>para actualizar el estado.</p><blockquote>React no actualiza el estado de manera instant\xE1nea, sino que agrega el pedido de actualizaci\xF3n a la cola para el pr\xF3ximo renderizado del componente, y la siguiente que vez que pase por nuestro <strong>useState </strong>omitir\xE1 el valor por defecto que le asignamos y en su lugar usar\xE1 el valor que estaba en la cola.</blockquote><p>Ya que sabemos la manera correcta de actualizar el estado, hay otra forma de hacerlo mucho m\xE1s amigable y corta, usando <strong>spread operator</strong></p><pre><code class="language-javascript">setFruits([...fruits, 'Manzana'])</code></pre><h2 id="usar-objetos-en-usestate"><strong>Usar objetos en useState</strong></h2><p>Con lo aprendido anteriormente, usemos estos mismos conocimiento con este tipo de dato, primero veamos cual es nuestro candidato para esta prueba \u{1F604}</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">  const [person, setPerson] = useState(
    {
      name: 'Diego',
      age: 22,
    }
  );</code></pre><figcaption>Definiendo el estado</figcaption></figure><p>Como bien lo dice el t\xEDtulo ahora probaremos con objetos, en este caso son los datos de una persona que se llama "Diego" como yo y casualmente tiene mi misma edad \u{1F914} jaja. </p><p>\xA1Concentr\xE9monos! Supongamos que me quiero aumentar la edad a 30, ya sabemos que para editar la propiedad de un objeto hacemos lo siguiente:</p><pre><code class="language-javascript">person.age = 30</code></pre><p>Por ende podemos pensar que para actualizar el valor de nuestro estado har\xEDamos esto</p><pre><code class="language-javascript">person.age = 30
setPerson(person)</code></pre><p>pero no nos funciona porque para React el estado nunca cambi\xF3 por ende no vio la necesidad de renderizar el componente nuevamente para reflejar este "cambio".</p><blockquote>Uno de los requisitos para que <strong>React </strong>refleje un nuevo estado, es que el mismo cambie y en el caso de los objetos utiliza <strong>Object.is </strong>para hacer esta comprobaci\xF3n</blockquote><p>Cuando tengamos que actualizar una propiedad de un objeto debemos pasarle uno nuevo junto a la propiedad modificada, para esto podemos usar el <strong>spread operator, </strong>te dejo un ejemplo \u{1F606}</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">import React, { useState } from "react";

const Person = () =&gt; {
  const [person, setPerson] = useState(
    {
      name: 'Diego',
      age: 22,
    }
  );
  const changeAge = () =&gt; {
    setPerson({...person, age: 30})
  }


  return &lt;div onClick={() =&gt; changeAge()}&gt;Edad de la persona {person.age}&lt;/div&gt;;
};

export default Person;
</code></pre><figcaption>Actualizamos mi edad cuando demos clic a el elemento div</figcaption></figure><h2 id="agradecimientos"><strong>Agradecimientos</strong></h2><p>Mil gracias si llegaste hasta aqu\xED, si te sirvi\xF3 de algo este art\xEDculo d\xE9jamelo saber en los comentarios y comp\xE1rtelo con tus amigos \u{1F970}</p><p>Si te quedaron dudas o deseas que explique alg\xFAn otro hook o cosa del mundo del frontend, av\xEDsame desde los comentarios \u{1F929}</p>`,
        comment_id: "5f8cc893966885001e79d750",
        feature_image: "https://ghost.dartiles.dev/content/images/2020/10/react-logo-2.png",
        featured: false,
        visibility: "public",
        send_email_when_published: false,
        created_at: "2020-10-18T19:58:27.000-03:00",
        updated_at: "2020-10-24T14:24:25.000-03:00",
        published_at: "2020-10-18T21:43:25.000-03:00",
        custom_excerpt: "Descubre a pronfudidad como se usa el hook useState, adem\xE1s te muestro casos particulares que posiblemente te hayan explotado la cabeza \u{1F92F}",
        codeinjection_head: null,
        codeinjection_foot: null,
        custom_template: null,
        canonical_url: null,
        tags: [
          {
            id: "5f8ced9d62d1f8001edf372d",
            name: "React",
            slug: "react",
            description: null,
            feature_image: null,
            visibility: "public",
            og_image: null,
            og_title: null,
            og_description: null,
            twitter_image: null,
            twitter_title: null,
            twitter_description: null,
            meta_title: null,
            meta_description: null,
            codeinjection_head: null,
            codeinjection_foot: null,
            canonical_url: null,
            accent_color: null,
            url: "https://ghost.dartiles.dev/tag/react/"
          },
          {
            id: "5f669a13e491f8001e550caa",
            name: "Javascript",
            slug: "javascript",
            description: null,
            feature_image: null,
            visibility: "public",
            og_image: null,
            og_title: null,
            og_description: null,
            twitter_image: null,
            twitter_title: null,
            twitter_description: null,
            meta_title: null,
            meta_description: null,
            codeinjection_head: null,
            codeinjection_foot: null,
            canonical_url: null,
            accent_color: null,
            url: "https://ghost.dartiles.dev/tag/javascript/"
          }
        ],
        authors: [
          {
            id: "1",
            name: "Diego Artiles",
            slug: "dartiles",
            profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
            cover_image: null,
            bio: null,
            website: null,
            location: null,
            facebook: null,
            twitter: null,
            meta_title: null,
            meta_description: null,
            url: "https://ghost.dartiles.dev/author/dartiles/"
          }
        ],
        primary_author: {
          id: "1",
          name: "Diego Artiles",
          slug: "dartiles",
          profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
          cover_image: null,
          bio: null,
          website: null,
          location: null,
          facebook: null,
          twitter: null,
          meta_title: null,
          meta_description: null,
          url: "https://ghost.dartiles.dev/author/dartiles/"
        },
        primary_tag: {
          id: "5f8ced9d62d1f8001edf372d",
          name: "React",
          slug: "react",
          description: null,
          feature_image: null,
          visibility: "public",
          og_image: null,
          og_title: null,
          og_description: null,
          twitter_image: null,
          twitter_title: null,
          twitter_description: null,
          meta_title: null,
          meta_description: null,
          codeinjection_head: null,
          codeinjection_foot: null,
          canonical_url: null,
          accent_color: null,
          url: "https://ghost.dartiles.dev/tag/react/"
        },
        url: "https://ghost.dartiles.dev/como-funciona-el-hook-usestate-y-como-usarlos-con-arrays-y-objetos/",
        excerpt: "Descubre a pronfudidad como se usa el hook useState, adem\xE1s te muestro casos particulares que posiblemente te hayan explotado la cabeza \u{1F92F}",
        reading_time: 4,
        access: true,
        og_image: null,
        og_title: null,
        og_description: null,
        twitter_image: null,
        twitter_title: null,
        twitter_description: null,
        meta_title: null,
        meta_description: null,
        email_subject: null,
        createdAt: "2020-10-18T19:58:27.000-03:00",
        desc: "Descubre a pronfudidad como se usa el hook useState, adem\xE1s te muestro casos particulares que posiblemente te hayan explotado la cabeza \u{1F92F}",
        image: "media/blog/como-funciona-el-hook-usestate-y-como-usarlos-con-arrays-y-objetos/como-funciona-el-hook-usestate-y-como-usarlos-con-arrays-y-objetos.png"
      },
      {
        id: "5f669903e491f8001e550c82",
        uuid: "fd13b219-2a92-43d8-ae74-d0941a35121a",
        title: "Novedades de EcmaScript 2020 o ES11",
        slug: "novedades-de-ecmascript-2020-o-es11",
        html: `<p>En este art\xEDculo me gustar\xEDa explicar un poco, todas las novedades ya disponibles en JavaScript.</p><p>Pero antes de empezar quisiera explicar algunas cosas:</p><h2 id="-qu-es-ecmascript"><strong>\xBFQu\xE9 es Ecmascript?</strong></h2><p>Ecmascript es el est\xE1ndar definido en ECMA-262 para los lenguajes de <em>scripting de prop\xF3sito general,</em> entre ellos se encuentra nuestro lenguaje favorito <em>JavaScript.</em></p><p>Esto es bastante confuso incluso hasta para mi, la forma m\xE1s f\xE1cil que se me hace de entender esto, es ver a EcmaScript como si fuese la RAE (quien es la que establece las normativas para el idioma Espa\xF1ol) de JavaScript.</p><p>Bueno, a continuaci\xF3n en este art\xEDculo quisiera compartir, las nuevas caracter\xEDsticas presentadas en este est\xE1ndar.</p><p>Ahora si, \xBFQu\xE9 hay de nuevo en esta versi\xF3n?</p><h2 id="importaciones-din-micas-dynamic-imports-"><strong>Importaciones Din\xE1micas (Dynamic Imports)</strong></h2><p>Algo que pasaba mucho en JavaScript, es que no pod\xEDamos importar m\xF3dulos seg\xFAn sean necesarios.</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">import * as myModule from './someModule.js/'
// o 
import { myModule } from './someModule.js/'

const button = document.getElementById('button')

button.addEventListener('click', () =&gt; myModule.doSomething())</code></pre><figcaption>Importaci\xF3n de M\xF3dulos antes de ES11</figcaption></figure><p>En este ejemplo estar\xEDamos utilizando el m\xE9todo <em>doSomething() </em>de <em>myModule, </em>en el evento click de alg\xFAn bot\xF3n. Independientemente de cuando ocurra el evento click, aqu\xED hay varios temas que debemos tener en cuenta:</p><ul><li>La importaci\xF3n de nuestro modulo se produce durante el tiempo de carga del m\xF3dulo actual.</li><li>No hay forma de cambiar la \u201Cdirecci\xF3n\u201D u \u201Corigen\u201D de nuestro modulo, din\xE1micamente.</li><li>Muy probablemente nuestro m\xF3dulo quede sin usarse (aunque este ya haya sido cargado), si no se produce el click tan esperado.</li></ul><p>Todo esto afecta el rendimiento de la aplicaci\xF3n que estemos desarrollando.</p><p>Con los <em>imports din\xE1micos, </em>nos despedimos de estos problemas:</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">const customPath = someExpression ? './somePath' : './anotherPath'

const button = document.getElementById('button')

button.addEventListener('click', async () =&gt; {
    const myModule = await import(\`\${customPath}/myModule.js\`)
    myModule.doSomething()
})</code></pre><figcaption>Importaci\xF3n din\xE1mica de m\xF3dulos implementada en ES11</figcaption></figure><p><strong>Import</strong> recibe el path donde se encuentra nuestro m\xF3dulo y devuelve una promesa al terminar.</p><h2 id="n-meros-enteros-m-s-grandes-bigint-"><strong>N\xFAmeros Enteros m\xE1s \u201Cgrandes\u201D (BigInt)</strong></h2><p>Hasta ahora en JavaScript pod\xEDamos hacer c\xE1lculos matem\xE1ticos cuyos resultados no sean mayores a 2\u2075\xB3\u200A\u2014\u200A1, es decir, hasta <strong>Number.MAX_SAFE_INTEGER.</strong></p><p>Les muestro un ejemplo sencillo de que pasa cuando nos sobrepasamos de este valor.</p><pre><code class="language-javascript">Number.MAX_SAFE_INTEGER
// 9007199254740991
Number.MAX_SAFE_INTEGER + 1
// 9007199254740992
Number.MAX_SAFE_INTEGER + 2
// 9007199254740992
Number.MAX_SAFE_INTEGER + 3
// 9007199254740994</code></pre><p>Con este ejemplo sabemos que JavaScript, no es capaz de representar c\xE1lculos matem\xE1ticos que superen el valor de <strong>Number.MAX_SAFE_INTEGER.</strong></p><p>Para solventar este problema se ha a\xF1adido un nuevo tipo de dato num\xE9rico, llamado BigInt que como su nombre indica solo soporta n\xFAmeros enteros.</p><p>La forma de utilizar este tipo de dato, es igual que <strong>Number </strong>o con la terminaci\xF3n \u201Cn\u201D precedido del n\xFAmero.</p><pre><code class="language-javascript">BigInt(Number.MAX_SAFE_INTEGER)
// 9007199254740991n
BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1)
// 9007199254740992n
BigInt(Number.MAX_SAFE_INTEGER) + BigInt(2)
// 9007199254740993n
BigInt(Number.MAX_SAFE_INTEGER) + BigInt(3)
// 9007199254740994n

BigInt(Number.MAX_SAFE_INTEGER) + 3n
// 9007199254740994n
9007199254740991n + 3n
// 90071992547409914n</code></pre><blockquote>BigInt y Number, no son compatibles entre s\xED por lo que no podemos hacer operaciones entre ambos.</blockquote><h2 id="promise-allsettled-"><strong>Promise.allSettled()</strong></h2><p>Este m\xE9todo para las promesas viene a\xF1adir una caracter\xEDstica que le faltaba al <strong>Promise.all()</strong>, el cual era resolver todas las promesas que le pas\xE1bamos independientemente de que alguna sea rechazada.</p><p>Recordemos <strong>Promise.all() </strong>lo que hac\xEDa es devolver un array con las respuestas de todas nuestras promesas SIEMPRE Y CUANDO NO HAYA SIDO RECHAZADA NINGUNA, en tal caso devolver\xEDa el error de la promesa rechazada y perder\xEDamos el valor de las promesas que si fueron exitosas.</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">var promise1 = Promise.resolve(3)
var promise2 = new Promise((resolve, reject) =&gt; setTimeout(() =&gt; reject('Error from PromiseAll'), 1000))
var promises = [promise1, promise2]

Promise.all(promises)
    .then(results =&gt; console.log(results))

// Output: Uncaught (in promise) Error from PromiseAll</code></pre><figcaption>Respuesta del m\xE9todo all, cuando una promesa es rechazada o tuvo un error</figcaption></figure><figure class="kg-card kg-code-card"><pre><code class="language-javascript">var promise1 = Promise.resolve(3)
var promise2 = new Promise((resolve, reject) =&gt; setTimeout(() =&gt; reject('Error from PromiseAllSettled'), 1000))
var promises = [promise1, promise2]

Promise.allSettled(promises)
    .then(results =&gt; console.log(results))

/* Output:

[
   {
      status: 'fulfilled',
      value: 3
   },
   {
      status: 'rejected',
      reason: 'Error from PromiseAllSettled'
   }
]

*/</code></pre><figcaption>Respuesta del m\xE9todo allSettled, cuando una promesa es rechazada o tuvo un error</figcaption></figure><p>A diferencia de de <strong>Promise.all(), Promise.allSettled() </strong>devuelve un array de objetos.</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">var promise1 = Promise.resolve(3)
var promise2 = new Promise((resolve, reject) =&gt; setTimeout(() =&gt; resolve('Promesa Exitosa'), 1000))
var promises = [promise1, promise2]

Promise.all(promises)
    .then(results =&gt; console.log(results))

// Output: [3, 'Promesa Exitosa']</code></pre><figcaption>Respuesta del m\xE9todo all, cuando todas las promesas fueron exitosas</figcaption></figure><figure class="kg-card kg-code-card"><pre><code class="language-javascript">var promise1 = Promise.resolve(3)
var promise2 = new Promise((resolve, reject) =&gt; setTimeout(() =&gt; resolve('Promesa Exitosa'), 1000))
var promises = [promise1, promise2]

Promise.allSettled(promises)
    .then(results =&gt; console.log(results))

/* Output:

[
   {
      status: fulfilled,
      value: 3
   },
   {
      status: 'fulfilled',
      reason: 'Promesa Exitosa'
   }
]

*/</code></pre><figcaption>Respuesta del m\xE9todo allSettled, cuando todas las promesas fueron exitosas</figcaption></figure><p>Entonces en resumen, <strong>Promise.allSettled() </strong>devuelve un array de objetos con los estados de todas las promesas (resueltas y rechazadas) y sus respectivos valores o errores (seg\xFAn sea el caso).</p><h2 id="-operador-de-fusi-n-nulo-nullish-coalescing-operator-"><strong>\u201COperador de fusi\xF3n nulo\u201D (Nullish Coalescing Operator)</strong></h2><p>En realidad no supe como traducir esto de una forma comprensible \u{1F622}</p><p>Este operador se denota con dos s\xEDmbolos de interrogaci\xF3n cerrados <strong>??, </strong>su funcionamiento es similar al operador OR, salvo algunas cositas \u{1F601}</p><p>Me gustar\xEDa explicar estas cositas con ejemplos:</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">const video = {
   title: 'My awasome video',
   views: 0
}

const views = video.views || 'Views not available yet'
// views: 'Views not available yet'</code></pre><figcaption>Evaluando la condici\xF3n con el operador OR (||)</figcaption></figure><p>Si tenemos esta expresi\xF3n, \xBFQu\xE9 valor tendr\xE1 nuestra constante <strong>views</strong>?</p><p>Ya sabemos que nuestro video tiene 0 visitas \u{1F625}, pero queremos mostrar este valor en alg\xFAn lado de la aplicaci\xF3n utilizando la constante <strong>views, </strong>lo que estaremos haciendo es mostrar \u2018Views not available yet\u2019 y no 0 precisamente porque el operador OR interpreta el cero como falso e inmediatamente se le asigna el valor por defecto.</p><p>Pero esto no est\xE1 bueno, porque en realidad las views si las tenemos, en este caso es 0, de ser <em>null</em> o <em>undefined </em>si ser\xEDa correcto asignar el valor por defecto.</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">const video = {
   title: 'My awasome video',
   views: 0
}

const views = video.views ?? 'Views not available yet'
// views: 0</code></pre><figcaption>Evaluando la condici\xF3n con el operador de fusi\xF3n nulo (??)</figcaption></figure><p>En resumen (||) es similar a (??), con la \xFAnica excepci\xF3n de que \xFAltimo solo contempla valores <em>null</em> o <em>undefined</em> para evaluar la siguiente expresi\xF3n.</p><h2 id="encadenamiento-opcional-optional-chaining-"><strong>Encadenamiento Opcional (Optional Chaining)</strong></h2><p>Utilizando en el mismo ejemplo del video, que pasa si queremos obtener el nombre del autor a partir del siguiente c\xF3digo:</p><pre><code class="language-javascript">const video = {
   title: 'My awasome video',
   views: 0,
   author: {
      name: 'Diego'
   }
}

const authorName = video.author.name || 'Unknown'
// authorName: 'Diego'

const video2 = {
   title: 'My awasome video',
   views: 0
}

const authorName2 = video2.author.name || 'Unknown'
// Output: Uncaught TypeError: Cannot read property 'name' of undefined</code></pre><p>Como ver\xE1n en <strong>authorName </strong>logramos obtener el nombre del autor del video sin problemas, pero en <strong>authorName2 </strong>obtenemos un error, esto se debe a que la propiedad <strong>author</strong> no existe en el objeto <strong>video2, </strong>debemos verificar si existe antes de intentar recuperarla, una de las formas que ten\xEDamos de hacer esto eran las siguientes:</p><figure class="kg-card kg-code-card"><pre><code class="language-javascript">const video = {
   title: 'My awesome video',
   views: 0
}

const authorName = (video.author || {}).name || 'Unknown'
// authorName: 'Unknown'

// OR

const authorName = video.author &amp;&amp; video.author.name || 'Unknown'
// authorName: 'Unknown'</code></pre><figcaption>Varias alternativas de acceder de manera segura al nombre del autor</figcaption></figure><p>Estas son solo alguna de las formas que tenemos para acceder a propiedades de objeto de manera segura, y las expresiones pueden llegar a ser mucho m\xE1s extensas si tenemos muchos subniveles.</p><p>Para solucionar esto llegaron los \u201CEncadenamientos Opcionales\u201D denotados con el s\xEDmbolo de interrogaci\xF3n cerrado (?) y ubicados antes de cada (.), usando este nuevo operador podemos simplificar nuestra expresi\xF3n sin obtener errores, el ejemplo anterior quedar\xEDa de la siguiente forma:</p><pre><code class="language-javascript">const video = {
   title: 'My awesome video',
   views: 0
}

const authorName = video.author?.name || 'Unknown'
// authorName: 'Unknown'</code></pre><p>Si alguna vez trabajaron con angular recordaran que esta caracter\xEDstica estaba soportaba en el template de los componentes, pero no en nuestros archivos con typescript.</p><h2 id="globalthis"><strong>GlobalThis</strong></h2><p>Como sabemos JavaScript es un lenguaje multiplaforma, es muy vers\xE1til y nos permite platorma. Uno de los inconvenientes que ten\xEDamos era poder acceder al objeto \u201Cglobal\u201D de nuestro entorno, y es que seg\xFAn en donde estemos ejecutando nuestro lenguaje la manera de acceder a este objeto global cambiaba.</p><p>Si quisi\xE9ramos obtener este objeto global independientemente del entorno, ten\xEDamos que realizar algo similar a esto:</p><pre><code class="language-javascript">const globalObject = () =&gt; {
    if (typeof self !== 'undefined') { return self; } // Web Workers
    if (typeof window !== 'undefined') { return self; } // Web Workers
    if (typeof global !== 'undefined') { return self; } // Web Workers
    throw new Error('can not find globalObject')
}</code></pre><p>Ahora con el <strong>globalThis </strong>no hace falta, ya que podemos acceder desde cualquier entorno/plataforma con solo llamarlo \u{1F600}</p><h2 id="conclusi-n"><strong>Conclusi\xF3n</strong></h2><p>Estas son las novedades de esta versi\xF3n m\xE1s destacadas de esta versi\xF3n, espero que las hayas entendido y a \xA1\xA1disfrutarlas!!.</p>`,
        comment_id: "5f669903e491f8001e550c82",
        feature_image: "https://ghost.dartiles.dev/content/images/2020/09/cover.png",
        featured: false,
        visibility: "public",
        send_email_when_published: false,
        created_at: "2020-09-19T20:49:23.000-03:00",
        updated_at: "2020-10-05T00:00:28.000-03:00",
        published_at: "2020-08-16T20:52:00.000-03:00",
        custom_excerpt: "Descubre las nuevas caracter\xEDsticas que trae esta nueva versi\xF3n de nuestro lenguaje favorito Javascript \u2764",
        codeinjection_head: null,
        codeinjection_foot: null,
        custom_template: null,
        canonical_url: null,
        tags: [
          {
            id: "5f669a13e491f8001e550caa",
            name: "Javascript",
            slug: "javascript",
            description: null,
            feature_image: null,
            visibility: "public",
            og_image: null,
            og_title: null,
            og_description: null,
            twitter_image: null,
            twitter_title: null,
            twitter_description: null,
            meta_title: null,
            meta_description: null,
            codeinjection_head: null,
            codeinjection_foot: null,
            canonical_url: null,
            accent_color: null,
            url: "https://ghost.dartiles.dev/tag/javascript/"
          }
        ],
        authors: [
          {
            id: "1",
            name: "Diego Artiles",
            slug: "dartiles",
            profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
            cover_image: null,
            bio: null,
            website: null,
            location: null,
            facebook: null,
            twitter: null,
            meta_title: null,
            meta_description: null,
            url: "https://ghost.dartiles.dev/author/dartiles/"
          }
        ],
        primary_author: {
          id: "1",
          name: "Diego Artiles",
          slug: "dartiles",
          profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
          cover_image: null,
          bio: null,
          website: null,
          location: null,
          facebook: null,
          twitter: null,
          meta_title: null,
          meta_description: null,
          url: "https://ghost.dartiles.dev/author/dartiles/"
        },
        primary_tag: {
          id: "5f669a13e491f8001e550caa",
          name: "Javascript",
          slug: "javascript",
          description: null,
          feature_image: null,
          visibility: "public",
          og_image: null,
          og_title: null,
          og_description: null,
          twitter_image: null,
          twitter_title: null,
          twitter_description: null,
          meta_title: null,
          meta_description: null,
          codeinjection_head: null,
          codeinjection_foot: null,
          canonical_url: null,
          accent_color: null,
          url: "https://ghost.dartiles.dev/tag/javascript/"
        },
        url: "https://ghost.dartiles.dev/novedades-de-ecmascript-2020-o-es11/",
        excerpt: "Descubre las nuevas caracter\xEDsticas que trae esta nueva versi\xF3n de nuestro lenguaje favorito Javascript \u2764",
        reading_time: 5,
        access: true,
        og_image: null,
        og_title: null,
        og_description: null,
        twitter_image: null,
        twitter_title: null,
        twitter_description: null,
        meta_title: null,
        meta_description: null,
        email_subject: null,
        createdAt: "2020-09-19T20:49:23.000-03:00",
        desc: "Descubre las nuevas caracter\xEDsticas que trae esta nueva versi\xF3n de nuestro lenguaje favorito Javascript \u2764",
        image: "media/blog/novedades-de-ecmascript-2020-o-es11/novedades-de-ecmascript-2020-o-es11.png"
      },
      {
        id: "5f6624d6d10169001e91e82e",
        uuid: "bac02383-ee81-4c7c-910d-6cf3b9b90be0",
        title: "Los Frontends Developers",
        slug: "aprende-mas-sobre-los-frontend-developers",
        html: '<p>En este art\xEDculo quiero hablar sobre quienes son los Frontend Developers y cuales son sus funciones en el mundo de la programaci\xF3n.</p><h2 id="-qu-es-un-frontend-developer">\xBFQu\xE9 es un Frontend Developer?</h2><p>Un Frontend Developer es el responsable de desarrollar la interfaz visual y la interacci\xF3n de una p\xE1gina web con el usuario, todo esto conforma el c\xF3digo fuente que el navegador leer\xE1 para mostrar la aplicaci\xF3n, es decir, un Frontend Developer es el encargado de lo que el usuario ve.</p><p>Un sencillo ejemplo de esto es la plataforma en la que est\xE1s leyendo este art\xEDculo, LinkedIn. Como sabemos esta sufri\xF3 un cambio en su interfaz ya que no era tan agradable como la conocemos hoy en d\xEDa, para realizar este cambio el equipo de desarrollo necesita a los Web Designers, encargados de armar la presentaci\xF3n visual de la p\xE1gina web en un formato PSD (Adobe Photoshop) o cualquier otro, y por supuesto a los Web Developers quienes se encargar\xE1n de llevar a la web dicha "presentaci\xF3n visual".</p><figure class="kg-card kg-image-card kg-card-hascaption"><img src="./media/blog/aprende-mas-sobre-los-frontend-developers/2020-09-linkedin.jpg" loading="lazy" class="kg-image" alt srcset="./media/blog/aprende-mas-sobre-los-frontend-developers/size-w600-2020-09-linkedin.jpg 600w, ./media/blog/aprende-mas-sobre-los-frontend-developers/size-w1000-2020-09-linkedin.jpg 1000w, ./media/blog/aprende-mas-sobre-los-frontend-developers/2020-09-linkedin.jpg 1200w" sizes="(min-width: 720px) 720px"><figcaption>Comparaci\xF3n de las versiones de LinkedIn</figcaption></figure><h2 id="subconjuntos-dentro-del-frontend">Subconjuntos dentro del Frontend</h2><p>Dentro de este rol hay quienes prefieren enfocarse en el \xE1rea de dise\xF1o, mientras que otros en el \xE1rea de la funcionalidad. Es por eso, por lo que a mi juicio este rol se divide en dos subconjuntos:</p><h3 id="dise-ador-web-y-maquetador-web">Dise\xF1ador web y Maquetador web</h3><figure class="kg-card kg-image-card kg-card-hascaption"><img src="./media/blog/aprende-mas-sobre-los-frontend-developers/2020-09-frontend.jpg" loading="lazy" class="kg-image" alt srcset="./media/blog/aprende-mas-sobre-los-frontend-developers/size-w600-2020-09-frontend.jpg 600w, ./media/blog/aprende-mas-sobre-los-frontend-developers/size-w1000-2020-09-frontend.jpg 1000w, ./media/blog/aprende-mas-sobre-los-frontend-developers/size-w1600-2020-09-frontend.jpg 1600w, ./media/blog/aprende-mas-sobre-los-frontend-developers/2020-09-frontend.jpg 1640w" sizes="(min-width: 720px) 720px"><figcaption>Una persona dise\xF1ando/maquetando</figcaption></figure><p>Un <strong>dise\xF1ador web,</strong> como su nombre lo indica es el responsable del dise\xF1o de la web. Su funci\xF3n es establecer los colores, el posicionamiento de los elementos, tales como el men\xFA, los botones, los banners, las im\xE1genes, entre otros.</p><p>Los dise\xF1adores web crean contenidos gr\xE1ficos ya sea im\xE1genes o videos, generalmente utilizando herramientas como Adobe Dreamweaver, Adobe Illustrator y/o Adobe Photoshop.</p><p>Una vez culminado el trabajo del dise\xF1ador, entra en juego el <strong>maquetador web</strong>. Esta persona es la responsable de traducir a c\xF3digo el dise\xF1o de la interfaz, manteniendo una similitud entre ellas. Generalmente esta persona debe trabajar en el Responsive Design, es decir, adaptar la interfaz de la web seg\xFAn el dispositivo que se est\xE9 utilizando para visitarla.</p><figure class="kg-card kg-image-card kg-card-hascaption"><img src="./media/blog/aprende-mas-sobre-los-frontend-developers/2020-09-responsive.jpg" loading="lazy" class="kg-image" alt srcset="./media/blog/aprende-mas-sobre-los-frontend-developers/size-w600-2020-09-responsive.jpg 600w, ./media/blog/aprende-mas-sobre-los-frontend-developers/size-w1000-2020-09-responsive.jpg 1000w, ./media/blog/aprende-mas-sobre-los-frontend-developers/size-w1600-2020-09-responsive.jpg 1600w, ./media/blog/aprende-mas-sobre-los-frontend-developers/2020-09-responsive.jpg 2232w" sizes="(min-width: 720px) 720px"><figcaption>Responsive Design</figcaption></figure><p>Los maquetadores web para llevar acabo su trabajo deben tener conocimiento en HTML que sirve para dar la estructura de tu proyecto, CSS esencial para aplicar estilos y Javascript (si aplica) fundamental para implementar la interactividad.</p><h3 id="desarrollador-web">Desarrollador Web</h3><p>Un Desarrollador Web es el encargado de la parte funcional de una p\xE1gina web.</p><p>La validaci\xF3n de formularios, el consumo de APIs (m\xE9todo de comunicaci\xF3n entre dos aplicaciones), guardar datos en LocalStorage (memoria del navegador) est\xE1 dentro de las funciones que \xE9ste ejerce como Frontend.</p><figure class="kg-card kg-image-card"><img src="./media/blog/aprende-mas-sobre-los-frontend-developers/2020-09-coding.jpg" loading="lazy" class="kg-image" alt srcset="./media/blog/aprende-mas-sobre-los-frontend-developers/size-w600-2020-09-coding.jpg 600w, ./media/blog/aprende-mas-sobre-los-frontend-developers/2020-09-coding.jpg 702w"></figure><p>En LinkedIn, para que el bot\xF3n "+ Seguir" funcione se debi\xF3 haber a\xF1adido una acci\xF3n al ser presionado, al igual que este bot\xF3n, muchos de los elementos de esta plataforma tienen asociado una acci\xF3n que se debe cumplir en base a lo que el usuario realice.</p><p>Quiero recalcar que la lista de funciones es muy extensa, tanto as\xED que sale del marco de lo que es un Frontend Developer.</p><p>Hay tareas como por ejemplo guardar los datos de los usuarios en una base de datos, la comunicaci\xF3n entre usuarios en un chat, que son imposibles de hacer para un Frontend Developer, ya que son tareas del Backend Developer.</p><p>Las tecnolog\xEDas que solemos usar son HTML, CSS y Javascript. Sin embargo, nos regimos de frameworks de Javascript como Angular, React, Vue.js o Ember.js y frameworks de CSS como Bootstrap o Foundation para facilitar nuestro trabajo.</p><h2 id="-cu-l-es-mi-rea"><strong>\xBFCu\xE1l es mi \xE1rea?</strong></h2><p>Si bien es cierto que tengo conocimientos en el dise\xF1o porque s\xE9 manejar Adobe Photoshop y hago propuestas (directas en el c\xF3digo) para que una aplicaci\xF3n luzca mejor, lo que m\xE1s me apasiona es el dinamismo que pueda llegar a tener una aplicaci\xF3n, me gusta mucho ordenar datos seg\xFAn un criterio, crear buscadores para filtrar datos y, sobre todo, me gusta que cada una de las cosas, sean lo m\xE1s amigable posible para el usuario.</p><p>En conclusi\xF3n, ambas \xE1reas son de mi agrado, pero me inclino m\xE1s en el desarrollo.</p><h2 id="descubre-m-s-">Descubre m\xE1s...</h2><figure class="kg-card kg-embed-card"><iframe width="612" height="344" src="https://www.youtube.com/embed/Tl0x_zf8I78?feature=oembed" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></figure><h2 id="ya-hemos-llegado-al-final-"><strong>Ya hemos llegado al final...</strong></h2><p>Antes de finalizar quisiera que recomendaran y compartieran este contenido, para ayudar a la comunidad a aprender un poco m\xE1s sobre los Frontend Developers.</p><p>Igualmente quienes deseen dejar un comentario es bienvenido, estoy abierto a sus opiniones, criticas o sugerencias.</p><p>Muchas gracias.</p>',
        comment_id: "5f6624d6d10169001e91e82e",
        feature_image: "https://ghost.dartiles.dev/content/images/2020/09/cover.jpg",
        featured: false,
        visibility: "public",
        send_email_when_published: false,
        created_at: "2020-09-19T12:33:42.000-03:00",
        updated_at: "2020-10-07T00:00:16.000-03:00",
        published_at: "2017-09-16T17:00:00.000-03:00",
        custom_excerpt: "Descubre las diferencias entre Maquetadores y Desarrolladores Frontend \u{1F601}",
        codeinjection_head: null,
        codeinjection_foot: null,
        custom_template: null,
        canonical_url: null,
        tags: [
          {
            id: "5f556bcfcf1401001e663201",
            name: "general",
            slug: "general",
            description: null,
            feature_image: null,
            visibility: "public",
            og_image: null,
            og_title: null,
            og_description: null,
            twitter_image: null,
            twitter_title: null,
            twitter_description: null,
            meta_title: null,
            meta_description: null,
            codeinjection_head: null,
            codeinjection_foot: null,
            canonical_url: null,
            accent_color: null,
            url: "https://ghost.dartiles.dev/tag/general/"
          }
        ],
        authors: [
          {
            id: "1",
            name: "Diego Artiles",
            slug: "dartiles",
            profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
            cover_image: null,
            bio: null,
            website: null,
            location: null,
            facebook: null,
            twitter: null,
            meta_title: null,
            meta_description: null,
            url: "https://ghost.dartiles.dev/author/dartiles/"
          }
        ],
        primary_author: {
          id: "1",
          name: "Diego Artiles",
          slug: "dartiles",
          profile_image: "https://ghost.dartiles.dev/content/images/2021/09/IMG_20201007_184610_831.jpg",
          cover_image: null,
          bio: null,
          website: null,
          location: null,
          facebook: null,
          twitter: null,
          meta_title: null,
          meta_description: null,
          url: "https://ghost.dartiles.dev/author/dartiles/"
        },
        primary_tag: {
          id: "5f556bcfcf1401001e663201",
          name: "general",
          slug: "general",
          description: null,
          feature_image: null,
          visibility: "public",
          og_image: null,
          og_title: null,
          og_description: null,
          twitter_image: null,
          twitter_title: null,
          twitter_description: null,
          meta_title: null,
          meta_description: null,
          codeinjection_head: null,
          codeinjection_foot: null,
          canonical_url: null,
          accent_color: null,
          url: "https://ghost.dartiles.dev/tag/general/"
        },
        url: "https://ghost.dartiles.dev/aprende-mas-sobre-los-frontend-developers/",
        excerpt: "Descubre las diferencias entre Maquetadores y Desarrolladores Frontend \u{1F601}",
        reading_time: 3,
        access: true,
        og_image: null,
        og_title: null,
        og_description: null,
        twitter_image: null,
        twitter_title: null,
        twitter_description: null,
        meta_title: "Que es un Frontend Developer",
        meta_description: "Descubre que que es ser Frontend Developer, las diferencias entre un maquetador web y un dise\xF1ador web y mucho m\xE1s.",
        email_subject: null,
        createdAt: "2020-09-19T12:33:42.000-03:00",
        desc: "Descubre las diferencias entre Maquetadores y Desarrolladores Frontend \u{1F601}",
        image: "media/blog/aprende-mas-sobre-los-frontend-developers/aprende-mas-sobre-los-frontend-developers.png"
      }
    ];
  }
});

// .svelte-kit/output/server/chunks/index.json-5960a6cc.js
var index_json_5960a6cc_exports = {};
__export(index_json_5960a6cc_exports, {
  get: () => get
});
async function get() {
  return {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: data.map((post) => ({ ...post, html: post.html.replace(/^\t{3}/gm, "") }))
  };
}
var init_index_json_5960a6cc = __esm({
  ".svelte-kit/output/server/chunks/index.json-5960a6cc.js"() {
    init_shims();
    init_posts_94db3c2d();
  }
});

// .svelte-kit/output/server/chunks/_posts-43b88639.js
var posts;
var init_posts_43b88639 = __esm({
  ".svelte-kit/output/server/chunks/_posts-43b88639.js"() {
    init_shims();
    init_posts_94db3c2d();
    posts = data;
    posts.forEach((post) => {
      post.html = post.html.replace(/^\t{3}/gm, "");
    });
  }
});

// .svelte-kit/output/server/chunks/_slug_.json-0c60619d.js
var slug_json_0c60619d_exports = {};
__export(slug_json_0c60619d_exports, {
  get: () => get2
});
async function get2({ params }) {
  const { slug } = params;
  return {
    status: lookup.has(slug) ? 200 : 404,
    headers: {
      "Content-Type": "application/json"
    },
    ...lookup.has(slug) && { message: "Not found" },
    body: lookup.get(slug)
  };
}
var lookup;
var init_slug_json_0c60619d = __esm({
  ".svelte-kit/output/server/chunks/_slug_.json-0c60619d.js"() {
    init_shims();
    init_posts_43b88639();
    init_posts_94db3c2d();
    lookup = new Map();
    posts.forEach((post) => {
      lookup.set(post.slug, JSON.stringify(post));
    });
  }
});

// .svelte-kit/output/server/chunks/TwitterIcon-32bf92c3.js
var TwitterIcon;
var init_TwitterIcon_32bf92c3 = __esm({
  ".svelte-kit/output/server/chunks/TwitterIcon-32bf92c3.js"() {
    init_shims();
    init_app_e5785616();
    TwitterIcon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "100%" } = $$props;
      let { strokeWidth = 2 } = $$props;
      let { class: customClass = "" } = $$props;
      if (size !== "100%") {
        size = size.slice(-1) === "x" ? size.slice(0, size.length - 1) + "em" : parseInt(size) + "px";
      }
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      if ($$props.strokeWidth === void 0 && $$bindings.strokeWidth && strokeWidth !== void 0)
        $$bindings.strokeWidth(strokeWidth);
      if ($$props.class === void 0 && $$bindings.class && customClass !== void 0)
        $$bindings.class(customClass);
      return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("width", size, 0)}${add_attribute("height", size, 0)} fill="${"none"}" viewBox="${"0 0 24 24"}" stroke="${"currentColor"}"${add_attribute("stroke-width", strokeWidth, 0)} stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-twitter " + escape2(customClass)}"><path d="${"M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"}"></path></svg>`;
    });
  }
});

// .svelte-kit/output/server/chunks/__layout-00749fbd.js
var layout_00749fbd_exports = {};
__export(layout_00749fbd_exports, {
  default: () => _layout
});
var import_cookie, GithubIcon, LinkedinIcon, css$1, Header, css, Main, _layout;
var init_layout_00749fbd = __esm({
  ".svelte-kit/output/server/chunks/__layout-00749fbd.js"() {
    init_shims();
    init_app_e5785616();
    init_TwitterIcon_32bf92c3();
    init_ssr();
    import_cookie = __toModule(require_cookie());
    init_dist();
    GithubIcon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "100%" } = $$props;
      let { strokeWidth = 2 } = $$props;
      let { class: customClass = "" } = $$props;
      if (size !== "100%") {
        size = size.slice(-1) === "x" ? size.slice(0, size.length - 1) + "em" : parseInt(size) + "px";
      }
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      if ($$props.strokeWidth === void 0 && $$bindings.strokeWidth && strokeWidth !== void 0)
        $$bindings.strokeWidth(strokeWidth);
      if ($$props.class === void 0 && $$bindings.class && customClass !== void 0)
        $$bindings.class(customClass);
      return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("width", size, 0)}${add_attribute("height", size, 0)} fill="${"none"}" viewBox="${"0 0 24 24"}" stroke="${"currentColor"}"${add_attribute("stroke-width", strokeWidth, 0)} stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-github " + escape2(customClass)}"><path d="${"M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"}"></path></svg>`;
    });
    LinkedinIcon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "100%" } = $$props;
      let { strokeWidth = 2 } = $$props;
      let { class: customClass = "" } = $$props;
      if (size !== "100%") {
        size = size.slice(-1) === "x" ? size.slice(0, size.length - 1) + "em" : parseInt(size) + "px";
      }
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      if ($$props.strokeWidth === void 0 && $$bindings.strokeWidth && strokeWidth !== void 0)
        $$bindings.strokeWidth(strokeWidth);
      if ($$props.class === void 0 && $$bindings.class && customClass !== void 0)
        $$bindings.class(customClass);
      return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("width", size, 0)}${add_attribute("height", size, 0)} fill="${"none"}" viewBox="${"0 0 24 24"}" stroke="${"currentColor"}"${add_attribute("stroke-width", strokeWidth, 0)} stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-linkedin " + escape2(customClass)}"><path d="${"M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"}"></path><rect x="${"2"}" y="${"9"}" width="${"4"}" height="${"12"}"></rect><circle cx="${"4"}" cy="${"4"}" r="${"2"}"></circle></svg>`;
    });
    css$1 = {
      code: '.header__container.svelte-1mpsuor.svelte-1mpsuor{background-color:#fff;color:#191a22;padding:1em;display:grid;grid-template-columns:minmax(auto, 1200px);justify-content:center;align-items:center;border-bottom:1px solid rgba(24, 28, 248, 0.2)}.header__container.svelte-1mpsuor .header__content.svelte-1mpsuor{display:flex;justify-content:space-between;align-items:center}.header__container.svelte-1mpsuor .header__content .header__logo-container.svelte-1mpsuor{display:inline-flex;align-items:center;text-decoration:none}.header__container.svelte-1mpsuor .header__content .header__logo-container .header__title.svelte-1mpsuor{color:#000;font-size:20px;font-weight:900;letter-spacing:0.8px;cursor:pointer;width:150px;margin:0 0 0 5px;font-family:"Hammersmith One", sans-serif;text-shadow:0 0 black}.header__container.svelte-1mpsuor .header__content .header__social-list.svelte-1mpsuor{margin:0;padding:0;list-style:none}.header__container.svelte-1mpsuor .header__content .header__social-list .header__social-item.svelte-1mpsuor{display:inline-block;margin:0 0.5em 0 0}.header__container.svelte-1mpsuor .header__content .header__social-list .header__social-link.svelte-1mpsuor{display:flex;align-items:center;border-radius:17px;color:black;text-decoration:none;font-weight:300;font-size:14px}',
      map: null
    };
    Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      $$result.css.add(css$1);
      return `<header class="${"header"}"><div class="${"header__container svelte-1mpsuor"}"><div class="${"header__content svelte-1mpsuor"}"><a href="${"/"}" rel="${"prefetch"}" class="${"header__logo-container svelte-1mpsuor"}"><img class="${"header__logo"}" src="${"logo.png"}" alt="${"logo"}" style="${"max-width: 35px"}">
                <h1 class="${"header__title svelte-1mpsuor"}">Dartiles</h1></a>
            <div class="${"header__social"}"><ul class="${"header__social-list svelte-1mpsuor"}"><li class="${"header__social-item svelte-1mpsuor"}"><a class="${"header__social-link header__social-link--twitter svelte-1mpsuor"}" href="${"https://twitter.com/intent/follow?screen_name=dartilesm"}" target="${"_blank"}" rel="${"noreferrer"}">${validate_component(TwitterIcon, "TwitterIcon").$$render($$result, { size: "24" }, {}, {})}</a></li>
                    <li class="${"header__social-item svelte-1mpsuor"}"><a class="${"header__social-link header__social-link--linkedin svelte-1mpsuor"}" href="${"https://www.linkedin.com/in/dartiles/"}" target="${"_blank"}" rel="${"noreferrer"}">${validate_component(LinkedinIcon, "LinkedinIcon").$$render($$result, { size: "24" }, {}, {})}</a></li>
                    <li class="${"header__social-item svelte-1mpsuor"}"><a class="${"header__social-link header__social-link--github svelte-1mpsuor"}" href="${"https://github.com/dartilesm/"}" target="${"_blank"}" rel="${"noreferrer"}">${validate_component(GithubIcon, "GithubIcon").$$render($$result, { size: "24" }, {}, {})}</a></li></ul></div></div></div></header>`;
    });
    css = {
      code: ".main.svelte-1nvx74n.svelte-1nvx74n{background:#f3f3f3}.main.svelte-1nvx74n .main__container.svelte-1nvx74n{position:relative;display:grid;grid-template-columns:minmax(auto, 1200px);justify-content:center;align-items:center}@media(max-width: 992px){.main.svelte-1nvx74n .main__container.svelte-1nvx74n{display:block}}.main.svelte-1nvx74n .main__container .main__content.svelte-1nvx74n{display:grid;grid-template-columns:3fr;padding:0 1em;grid-gap:60px;justify-content:space-between}@media(max-width: 992px){.main.svelte-1nvx74n .main__container .main__content.svelte-1nvx74n{display:block;padding:0}}",
      map: null
    };
    Main = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      $$result.css.add(css);
      return `<main class="${"main svelte-1nvx74n"}"><div class="${"main__container svelte-1nvx74n"}"><div class="${"main__content svelte-1nvx74n"}">${slots.default ? slots.default({}) : ``}</div></div></main>`;
    });
    _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { segment } = $$props;
      if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0)
        $$bindings.segment(segment);
      return `${validate_component(Header, "Header").$$render($$result, { segment }, {}, {})}

${validate_component(Main, "Main").$$render($$result, {}, {}, {
        default: () => `${slots.default ? slots.default({}) : ``}`
      })}`;
    });
  }
});

// .svelte-kit/output/server/chunks/error-ed2c1f6f.js
var error_ed2c1f6f_exports = {};
__export(error_ed2c1f6f_exports, {
  default: () => Error2,
  load: () => load
});
function load({ error: error2, status }) {
  return { props: { error: error2, status } };
}
var import_cookie2, Error2;
var init_error_ed2c1f6f = __esm({
  ".svelte-kit/output/server/chunks/error-ed2c1f6f.js"() {
    init_shims();
    init_app_e5785616();
    init_ssr();
    import_cookie2 = __toModule(require_cookie());
    init_dist();
    Error2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { status } = $$props;
      let { error: error2 } = $$props;
      if ($$props.status === void 0 && $$bindings.status && status !== void 0)
        $$bindings.status(status);
      if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
        $$bindings.error(error2);
      return `<h1>${escape2(status)}</h1>

<pre>${escape2(error2.message)}</pre>



${error2.frame ? `<pre>${escape2(error2.frame)}</pre>` : ``}
${error2.stack ? `<pre>${escape2(error2.stack)}</pre>` : ``}`;
    });
  }
});

// .svelte-kit/output/server/chunks/PostItem-a00467fb.js
var BookOpenIcon, CalendarIcon, TagIcon, timeFormatter, readingTime, css$12, Card, css2, PostItem;
var init_PostItem_a00467fb = __esm({
  ".svelte-kit/output/server/chunks/PostItem-a00467fb.js"() {
    init_shims();
    init_app_e5785616();
    BookOpenIcon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "100%" } = $$props;
      let { strokeWidth = 2 } = $$props;
      let { class: customClass = "" } = $$props;
      if (size !== "100%") {
        size = size.slice(-1) === "x" ? size.slice(0, size.length - 1) + "em" : parseInt(size) + "px";
      }
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      if ($$props.strokeWidth === void 0 && $$bindings.strokeWidth && strokeWidth !== void 0)
        $$bindings.strokeWidth(strokeWidth);
      if ($$props.class === void 0 && $$bindings.class && customClass !== void 0)
        $$bindings.class(customClass);
      return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("width", size, 0)}${add_attribute("height", size, 0)} fill="${"none"}" viewBox="${"0 0 24 24"}" stroke="${"currentColor"}"${add_attribute("stroke-width", strokeWidth, 0)} stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-book-open " + escape2(customClass)}"><path d="${"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"}"></path><path d="${"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"}"></path></svg>`;
    });
    CalendarIcon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "100%" } = $$props;
      let { strokeWidth = 2 } = $$props;
      let { class: customClass = "" } = $$props;
      if (size !== "100%") {
        size = size.slice(-1) === "x" ? size.slice(0, size.length - 1) + "em" : parseInt(size) + "px";
      }
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      if ($$props.strokeWidth === void 0 && $$bindings.strokeWidth && strokeWidth !== void 0)
        $$bindings.strokeWidth(strokeWidth);
      if ($$props.class === void 0 && $$bindings.class && customClass !== void 0)
        $$bindings.class(customClass);
      return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("width", size, 0)}${add_attribute("height", size, 0)} fill="${"none"}" viewBox="${"0 0 24 24"}" stroke="${"currentColor"}"${add_attribute("stroke-width", strokeWidth, 0)} stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-calendar " + escape2(customClass)}"><rect x="${"3"}" y="${"4"}" width="${"18"}" height="${"18"}" rx="${"2"}" ry="${"2"}"></rect><line x1="${"16"}" y1="${"2"}" x2="${"16"}" y2="${"6"}"></line><line x1="${"8"}" y1="${"2"}" x2="${"8"}" y2="${"6"}"></line><line x1="${"3"}" y1="${"10"}" x2="${"21"}" y2="${"10"}"></line></svg>`;
    });
    TagIcon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "100%" } = $$props;
      let { strokeWidth = 2 } = $$props;
      let { class: customClass = "" } = $$props;
      if (size !== "100%") {
        size = size.slice(-1) === "x" ? size.slice(0, size.length - 1) + "em" : parseInt(size) + "px";
      }
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      if ($$props.strokeWidth === void 0 && $$bindings.strokeWidth && strokeWidth !== void 0)
        $$bindings.strokeWidth(strokeWidth);
      if ($$props.class === void 0 && $$bindings.class && customClass !== void 0)
        $$bindings.class(customClass);
      return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("width", size, 0)}${add_attribute("height", size, 0)} fill="${"none"}" viewBox="${"0 0 24 24"}" stroke="${"currentColor"}"${add_attribute("stroke-width", strokeWidth, 0)} stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-tag " + escape2(customClass)}"><path d="${"M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"}"></path><line x1="${"7"}" y1="${"7"}" x2="${"7.01"}" y2="${"7"}"></line></svg>`;
    });
    timeFormatter = (isoTime) => {
      let date = new Date(isoTime);
      let options2 = { year: "numeric", month: "short", day: "2-digit" };
      return date.toLocaleDateString("es-ES", options2);
    };
    readingTime = (text) => {
      const wordPerMinute = 200;
      const numOfWords = text.split(/\s/g).length;
      const minutes = numOfWords / wordPerMinute;
      const readTime = Math.ceil(minutes);
      return `${readTime} Min`;
    };
    css$12 = {
      code: ".Card-container.svelte-18x4e1m{color:#191a22;position:relative;display:block;border-radius:5px;background-color:white;text-decoration:none;-webkit-box-shadow:0 8px 30px rgba(0, 0, 0, 0.12);-moz-box-shadow:0 8px 30px rgba(0, 0, 0, 0.12);box-shadow:0 8px 30px rgba(0, 0, 0, 0.12)}.Card-container.is-clickeable.svelte-18x4e1m{cursor:pointer}.Card-container.svelte-18x4e1m:hover{-webkit-box-shadow:0 8px 30px rgba(0, 0, 0, 0.2);-moz-box-shadow:0 8px 30px rgba(0, 0, 0, 0.2);box-shadow:0 8px 30px rgba(0, 0, 0, 0.2)}",
      map: null
    };
    Card = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      const disptach = createEventDispatcher();
      disptach("click");
      let { toLink } = $$props;
      let { isClickeable } = $$props;
      if ($$props.toLink === void 0 && $$bindings.toLink && toLink !== void 0)
        $$bindings.toLink(toLink);
      if ($$props.isClickeable === void 0 && $$bindings.isClickeable && isClickeable !== void 0)
        $$bindings.isClickeable(isClickeable);
      $$result.css.add(css$12);
      return `${toLink ? `<a rel="${"prefetch"}"${add_attribute("href", toLink, 0)} class="${"Card-container is-clickeable svelte-18x4e1m"}">${slots.default ? slots.default({}) : ``}</a>` : `<div class="${["Card-container svelte-18x4e1m", !!isClickeable ? "is-clickeable" : ""].join(" ").trim()}">${slots.default ? slots.default({}) : ``}</div>`}`;
    });
    css2 = {
      code: ".post-card.svelte-1yy6jf9.svelte-1yy6jf9{font-size:16px;font-weight:300;display:grid;justify-content:space-between;grid-gap:5px;grid-template-columns:1fr}.post-card.svelte-1yy6jf9 .post-card__header.svelte-1yy6jf9{width:100%;height:200px;border-radius:5px 5px 0px 0px;background-size:cover;background-position:center;background-repeat:no-repeat}.post-card.svelte-1yy6jf9 .post-card__body.svelte-1yy6jf9{padding:10px}.post-card.svelte-1yy6jf9 .post-card__body .post-card__title-container.svelte-1yy6jf9{font-size:20px;margin:0;padding:0}.post-card.svelte-1yy6jf9 .post-card__body .post-card__title-container .post-card__title.svelte-1yy6jf9{font-size:1.1em;color:black;margin-bottom:-5px}.post-card.svelte-1yy6jf9 .post-card__body .post-card__title-container .post-card__details.svelte-1yy6jf9{color:#333;font-size:13px;font-weight:300;padding:0;display:flex;align-items:center;flex-wrap:wrap}.post-card.svelte-1yy6jf9 .post-card__body .post-card__title-container .post-card__details .post-card__details-time.svelte-1yy6jf9,.post-card.svelte-1yy6jf9 .post-card__body .post-card__title-container .post-card__details .post-card__details-reading-time.svelte-1yy6jf9{display:inline-flex;align-items:center;font-weight:500;font-size:1.1em}.post-card.svelte-1yy6jf9 .post-card__body .post-card__title-container .post-card__details .post-card__details-reading-time.svelte-1yy6jf9{margin:0 10px}.post-card.svelte-1yy6jf9 .post-card__body .post-card__title-container .post-card__details .post-card__details-tag.svelte-1yy6jf9{background-color:#495460;padding:0px 5px;margin:10px 0;border-radius:4px;font-size:1em;color:white;font-weight:400;text-transform:capitalize;display:inline-flex;justify-content:center;align-items:center}.post-card.svelte-1yy6jf9 .post-card__body .post-card__title-container .post-card__author.svelte-1yy6jf9{font-size:0.7em;display:inline-flex;justify-content:center;align-items:center;font-weight:bold;color:#757575}.post-card.svelte-1yy6jf9 .post-card__body .post-card__title-container .post-card__author .post-card__author-bold.svelte-1yy6jf9{color:#000;margin-left:4px}.post-card.svelte-1yy6jf9 .post-card__body .post-card__description-container .post-card__description-text.svelte-1yy6jf9{color:#333;font-size:16px;line-height:28px;margin:0px;word-break:break-word}",
      map: null
    };
    PostItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { post } = $$props;
      if ($$props.post === void 0 && $$bindings.post && post !== void 0)
        $$bindings.post(post);
      $$result.css.add(css2);
      return `${validate_component(Card, "Card").$$render($$result, { toLink: "/blog/" + post.slug }, {}, {
        default: () => `<div class="${"post-card svelte-1yy6jf9"}"><div class="${"post-card__header svelte-1yy6jf9"}" style="${"background-image: url(/" + escape2(post.image) + ")"}"></div>
        <div class="${"post-card__body svelte-1yy6jf9"}"><div class="${"post-card__title-container svelte-1yy6jf9"}"><h3 class="${"post-card__title svelte-1yy6jf9"}">${escape2(post.title)}</h3>
                <span class="${"post-card__author svelte-1yy6jf9"}">por <span class="${"post-card__author-bold svelte-1yy6jf9"}">${escape2(post.primary_author?.name)}</span></span>
                <div class="${"post-card__details svelte-1yy6jf9"}"><time class="${"post-card__details-time svelte-1yy6jf9"}"${add_attribute("datetime", post.published_at, 0)}>${validate_component(CalendarIcon, "CalendarIcon").$$render($$result, { size: "20" }, {}, {})}
                        \xA0\xA0${escape2(timeFormatter(post.published_at))}</time>
                    <span class="${"post-card__details-reading-time svelte-1yy6jf9"}">${validate_component(BookOpenIcon, "BookOpenIcon").$$render($$result, { size: "20" }, {}, {})}
                        \xA0\xA0${escape2(readingTime(post.html))}</span>
                    ${post.primary_tag?.name ? `<span class="${"post-card__details-tag svelte-1yy6jf9"}">${validate_component(TagIcon, "TagIcon").$$render($$result, { size: "13" }, {}, {})}
                            \xA0\xA0${escape2(post.primary_tag?.name)}</span>` : ``}</div></div>
            <div class="${"post-card__description-container"}"><p class="${"post-card__description-text svelte-1yy6jf9"}">${escape2(post.meta_description || post.excerpt)}</p></div></div></div>`
      })}`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-724c00c4.js
var index_724c00c4_exports = {};
__export(index_724c00c4_exports, {
  default: () => Routes,
  load: () => load2,
  prerender: () => prerender
});
var import_cookie3, css3, prerender, load2, Routes;
var init_index_724c00c4 = __esm({
  ".svelte-kit/output/server/chunks/index-724c00c4.js"() {
    init_shims();
    init_app_e5785616();
    init_PostItem_a00467fb();
    init_ssr();
    import_cookie3 = __toModule(require_cookie());
    init_dist();
    css3 = {
      code: ".Home.svelte-1uo1aq9{padding:2em 0;min-height:calc(100vh - 251px)}.Posts.svelte-1uo1aq9{display:grid;justify-content:space-between;grid-gap:15px;grid-template-columns:1fr 1fr 1fr}@media screen and (max-width: 768px){.Posts.svelte-1uo1aq9{grid-template-columns:1fr}}@media screen and (max-width: 993px){.Home.svelte-1uo1aq9{padding:2em 1em}}@media(min-width: 769px) and (max-width: 993px){.Posts.svelte-1uo1aq9{grid-template-columns:1fr 1fr}}",
      map: null
    };
    prerender = true;
    load2 = async ({ fetch: fetch2 }) => {
      const response = await fetch2(`blog.json`);
      if (response.ok) {
        const posts2 = await response.json();
        return { props: { posts: posts2 } };
      }
      const { message } = await response.json();
      return { error: new Error(message) };
    };
    Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { posts: posts2 } = $$props;
      if ($$props.posts === void 0 && $$bindings.posts && posts2 !== void 0)
        $$bindings.posts(posts2);
      $$result.css.add(css3);
      return `${$$result.head += `${$$result.title = `<title>Dartiles \u{1F4F0}\u{1F913}</title>`, ""}<meta name="${"title"}" content="${"Dartiles \u{1F4F0}\u{1F913}"}" data-svelte="svelte-mquiwj"><meta name="${"description"}" content="${"Comunidad IT para compartir conocimientos"}" data-svelte="svelte-mquiwj"><meta name="${"keywords"}" content="${"javascript, react, svelte, angular, nodejs, nestjs, tutoriales, hooks de react, trucos de svelte, react hooks, redux, jsx"}" data-svelte="svelte-mquiwj"><meta property="${"og:type"}" content="${"website"}" data-svelte="svelte-mquiwj"><meta property="${"og:url"}" content="${"https://dartiles.dev/"}" data-svelte="svelte-mquiwj"><meta property="${"og:title"}" content="${"Dartiles \u{1F4F0}\u{1F913}"}" data-svelte="svelte-mquiwj"><meta property="${"og:description"}" content="${"Comunidad IT para compartir conocimientos"}" data-svelte="svelte-mquiwj"><meta property="${"og:image"}" content="${"https://dartiles.dev/media/main/main-image.jpg"}" data-svelte="svelte-mquiwj"><meta property="${"og:locale"}" content="${"es_ES"}" data-svelte="svelte-mquiwj"><meta name="${"twitter:card"}" content="${"summary_large_image"}" data-svelte="svelte-mquiwj"><meta name="${"twitter:site"}" content="${"@dartilesm"}" data-svelte="svelte-mquiwj"><meta name="${"twitter:creator"}" content="${"@dartilesm"}" data-svelte="svelte-mquiwj"><meta name="${"twitter:url"}" content="${"https://dartiles.dev/"}" data-svelte="svelte-mquiwj"><meta name="${"twitter:title"}" content="${"Dartiles \u{1F4F0}\u{1F913}"}" data-svelte="svelte-mquiwj"><meta name="${"twitter:description"}" content="${"Comunidad IT para compartir conocimientos"}" data-svelte="svelte-mquiwj"><meta name="${"twitter:image"}" content="${"https://dartiles.dev/media/main/main-image.jpg"}" data-svelte="svelte-mquiwj">`, ""}

<div class="${"Home svelte-1uo1aq9"}"><div class="${"Posts svelte-1uo1aq9"}">${each(posts2, (post) => `${validate_component(PostItem, "Post").$$render($$result, { post }, {}, {})}`)}</div>
</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-fc32fa53.js
var index_fc32fa53_exports = {};
__export(index_fc32fa53_exports, {
  default: () => Blog,
  load: () => load3
});
var import_cookie4, load3, Blog;
var init_index_fc32fa53 = __esm({
  ".svelte-kit/output/server/chunks/index-fc32fa53.js"() {
    init_shims();
    init_app_e5785616();
    init_ssr();
    import_cookie4 = __toModule(require_cookie());
    init_dist();
    load3 = async () => {
      return { status: 301, redirect: "/" };
    };
    Blog = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return ``;
    });
  }
});

// .svelte-kit/output/server/chunks/_slug_-9cf6d69e.js
var slug_9cf6d69e_exports = {};
__export(slug_9cf6d69e_exports, {
  default: () => U5Bslugu5D,
  load: () => load4
});
var import_cookie5, sendEventGA, MessageSquareIcon, UserIcon, getStores, css$3, GridLayout2Fr, css$2, Sidebar, css$13, SocialToolbox, css4, load4, U5Bslugu5D;
var init_slug_9cf6d69e = __esm({
  ".svelte-kit/output/server/chunks/_slug_-9cf6d69e.js"() {
    init_shims();
    init_app_e5785616();
    init_PostItem_a00467fb();
    init_posts_43b88639();
    init_TwitterIcon_32bf92c3();
    init_ssr();
    import_cookie5 = __toModule(require_cookie());
    init_dist();
    init_posts_94db3c2d();
    sendEventGA = (event_name, event_category, event_label) => {
      if (typeof window !== "undefined" && gtag) {
        gtag("event", event_name, {
          event_category,
          event_label
        });
      }
    };
    MessageSquareIcon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "100%" } = $$props;
      let { strokeWidth = 2 } = $$props;
      let { class: customClass = "" } = $$props;
      if (size !== "100%") {
        size = size.slice(-1) === "x" ? size.slice(0, size.length - 1) + "em" : parseInt(size) + "px";
      }
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      if ($$props.strokeWidth === void 0 && $$bindings.strokeWidth && strokeWidth !== void 0)
        $$bindings.strokeWidth(strokeWidth);
      if ($$props.class === void 0 && $$bindings.class && customClass !== void 0)
        $$bindings.class(customClass);
      return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("width", size, 0)}${add_attribute("height", size, 0)} fill="${"none"}" viewBox="${"0 0 24 24"}" stroke="${"currentColor"}"${add_attribute("stroke-width", strokeWidth, 0)} stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-message-square " + escape2(customClass)}"><path d="${"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"}"></path></svg>`;
    });
    UserIcon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { size = "100%" } = $$props;
      let { strokeWidth = 2 } = $$props;
      let { class: customClass = "" } = $$props;
      if (size !== "100%") {
        size = size.slice(-1) === "x" ? size.slice(0, size.length - 1) + "em" : parseInt(size) + "px";
      }
      if ($$props.size === void 0 && $$bindings.size && size !== void 0)
        $$bindings.size(size);
      if ($$props.strokeWidth === void 0 && $$bindings.strokeWidth && strokeWidth !== void 0)
        $$bindings.strokeWidth(strokeWidth);
      if ($$props.class === void 0 && $$bindings.class && customClass !== void 0)
        $$bindings.class(customClass);
      return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("width", size, 0)}${add_attribute("height", size, 0)} fill="${"none"}" viewBox="${"0 0 24 24"}" stroke="${"currentColor"}"${add_attribute("stroke-width", strokeWidth, 0)} stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-user " + escape2(customClass)}"><path d="${"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"}"></path><circle cx="${"12"}" cy="${"7"}" r="${"4"}"></circle></svg>`;
    });
    getStores = () => {
      const stores = getContext("__svelte__");
      return {
        page: {
          subscribe: stores.page.subscribe
        },
        navigating: {
          subscribe: stores.navigating.subscribe
        },
        get preloading() {
          console.error("stores.preloading is deprecated; use stores.navigating instead");
          return {
            subscribe: stores.navigating.subscribe
          };
        },
        session: stores.session
      };
    };
    css$3 = {
      code: ".grid-layaout-2fr.svelte-1vlbv7h.svelte-1vlbv7h{display:grid;grid-gap:20px;grid-template-columns:minmax(200px, 2fr) 1fr}@media(max-width: 992px){.grid-layaout-2fr.svelte-1vlbv7h.svelte-1vlbv7h{grid-template-columns:minmax(200px, 2fr)}}.grid-layaout-2fr.svelte-1vlbv7h .grid-layaout-2fr__container.svelte-1vlbv7h{background-color:white;border-left:1px solid #e6e6e6;border-right:1px solid #e6e6e6}.grid-layaout-2fr.svelte-1vlbv7h .grid-layaout-2fr__container.svelte-1vlbv7h h2,.grid-layaout-2fr.svelte-1vlbv7h .grid-layaout-2fr__container.svelte-1vlbv7h h3{color:#0271ef}",
      map: null
    };
    GridLayout2Fr = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      $$result.css.add(css$3);
      return `<div class="${"grid-layaout-2fr svelte-1vlbv7h"}"><div class="${"grid-layaout-2fr__container svelte-1vlbv7h"}">${slots["fr-1"] ? slots["fr-1"]({}) : ``}</div>
    ${slots["fr-2"] ? slots["fr-2"]({}) : ``}</div>`;
    });
    css$2 = {
      code: ".sidebar.svelte-17m928n.svelte-17m928n{display:block;border-radius:4px;padding:15px;box-sizing:border-box}.sidebar.svelte-17m928n .sidebar__container.sticky.svelte-17m928n{position:sticky;top:15px}.sidebar.svelte-17m928n .sidebar__container .sidebar__temary-container .sidebar__title.svelte-17m928n{font-size:1.17rem}.sidebar.svelte-17m928n .sidebar__container .sidebar__temary-container .sidebar__temary-list.svelte-17m928n{list-style:none;padding:0;position:relative}.sidebar.svelte-17m928n .sidebar__container .sidebar__temary-container .sidebar__temary-list .sidebar__temary-item.svelte-17m928n{padding-left:1.2em;cursor:pointer;border-left:3px solid #0000001f;margin:5px 0;font-size:0.9rem}.sidebar.svelte-17m928n .sidebar__container .sidebar__temary-container .sidebar__temary-list .sidebar__temary-item.active.svelte-17m928n{color:#0271ef;font-weight:400;border-left:3px solid #0271ef}.sidebar.svelte-17m928n .sidebar__container .sidebar__temary-container .sidebar__temary-list .sidebar__temary-item .sidebar__temary-item-text.svelte-17m928n{margin:0}",
      map: null
    };
    Sidebar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { currentPost } = $$props;
      let { temary } = $$props;
      let { isStickySidebar } = $$props;
      let { onTemaryClick } = $$props;
      let { showTemary } = $$props;
      let recommendedPosts = [];
      if ($$props.currentPost === void 0 && $$bindings.currentPost && currentPost !== void 0)
        $$bindings.currentPost(currentPost);
      if ($$props.temary === void 0 && $$bindings.temary && temary !== void 0)
        $$bindings.temary(temary);
      if ($$props.isStickySidebar === void 0 && $$bindings.isStickySidebar && isStickySidebar !== void 0)
        $$bindings.isStickySidebar(isStickySidebar);
      if ($$props.onTemaryClick === void 0 && $$bindings.onTemaryClick && onTemaryClick !== void 0)
        $$bindings.onTemaryClick(onTemaryClick);
      if ($$props.showTemary === void 0 && $$bindings.showTemary && showTemary !== void 0)
        $$bindings.showTemary(showTemary);
      $$result.css.add(css$2);
      recommendedPosts = posts.filter((post) => post.title !== currentPost.title).slice(0, 1);
      return `<div class="${"sidebar svelte-17m928n"}"><div class="${["sidebar__container svelte-17m928n", isStickySidebar ? "sticky" : ""].join(" ").trim()}">${showTemary ? `<div class="${"sidebar__temary-container"}"><h3 class="${"sidebar__title svelte-17m928n"}">Temario</h3>
                <ul class="${"sidebar__temary-list svelte-17m928n"}">${each(temary, (element) => `<li class="${["sidebar__temary-item svelte-17m928n", element.isActive ? "active" : ""].join(" ").trim()}"><p class="${"sidebar__temary-item-text svelte-17m928n"}">${escape2(element.innerText)}</p>
                        </li>`)}</ul></div>` : ``}
        <div class="${"post-container"}"><h3 class="${"sidebar__title svelte-17m928n"}">Otras publicaciones</h3>
            ${each(recommendedPosts, (post) => `${validate_component(PostItem, "Post").$$render($$result, { post }, {}, {})}`)}</div></div></div>`;
    });
    css$13 = {
      code: ".social-box.svelte-bz876m.svelte-bz876m{background-color:white;display:flex;width:fit-content;padding:0;border-radius:10px;-webkit-box-shadow:0 8px 30px rgba(0, 0, 0, 0.12);-moz-box-shadow:0 8px 30px rgba(0, 0, 0, 0.12);box-shadow:0 8px 30px rgba(0, 0, 0, 0.12);position:fixed;bottom:20px;left:50%;transform:scale(0) translateX(-120%) translateY(100px);transition:all ease 0.25s;opacity:0}.social-box.is-floating.svelte-bz876m.svelte-bz876m{opacity:1;height:auto;width:auto;transform:scale(1) translateX(-50%) translateY(0)}.social-box.svelte-bz876m.svelte-bz876m:hover{-webkit-box-shadow:0 8px 30px rgba(0, 0, 0, 0.2);-moz-box-shadow:0 8px 30px rgba(0, 0, 0, 0.2);box-shadow:0 8px 30px rgba(0, 0, 0, 0.2)}.social-box.svelte-bz876m .social-box__comment-container.svelte-bz876m{display:flex;justify-content:center;align-items:center;padding:5px 10px;border-radius:0 10px 10px 0;cursor:pointer}.social-box.svelte-bz876m .social-box__comment-container .social-box__social-text.svelte-bz876m{margin:0 0 0 5px;font-weight:bold}.social-box.svelte-bz876m .social-box__twitter-container.svelte-bz876m{display:flex;justify-content:center;align-items:center;color:#1da1f2;padding:5px 10px;border-radius:10px 0 0 10px;cursor:pointer}.social-box.svelte-bz876m .social-box__limiter.svelte-bz876m{font-weight:bold;font-size:20px}.social-box.svelte-bz876m .social-box__social-text.svelte-bz876m{font-weight:bold;text-decoration:none;margin:0 0 0 5px}",
      map: null
    };
    SocialToolbox = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { text } = $$props;
      let { postUrl } = $$props;
      let { hashtags = "" } = $$props;
      let { twitterUsername } = $$props;
      let { related = "" } = $$props;
      let { commentsElement } = $$props;
      let { isFloating } = $$props;
      if ($$props.text === void 0 && $$bindings.text && text !== void 0)
        $$bindings.text(text);
      if ($$props.postUrl === void 0 && $$bindings.postUrl && postUrl !== void 0)
        $$bindings.postUrl(postUrl);
      if ($$props.hashtags === void 0 && $$bindings.hashtags && hashtags !== void 0)
        $$bindings.hashtags(hashtags);
      if ($$props.twitterUsername === void 0 && $$bindings.twitterUsername && twitterUsername !== void 0)
        $$bindings.twitterUsername(twitterUsername);
      if ($$props.related === void 0 && $$bindings.related && related !== void 0)
        $$bindings.related(related);
      if ($$props.commentsElement === void 0 && $$bindings.commentsElement && commentsElement !== void 0)
        $$bindings.commentsElement(commentsElement);
      if ($$props.isFloating === void 0 && $$bindings.isFloating && isFloating !== void 0)
        $$bindings.isFloating(isFloating);
      $$result.css.add(css$13);
      return `<div class="${["social-box svelte-bz876m", isFloating ? "is-floating" : ""].join(" ").trim()}"><div class="${"social-box__twitter-container svelte-bz876m"}">${validate_component(TwitterIcon, "TwitterIcon").$$render($$result, { size: "24", class: "twitter-icon" }, {}, {})}
		<p class="${"social-box__social-text svelte-bz876m"}">Compartir</p></div>
	<span class="${"social-box__limiter svelte-bz876m"}">|</span>
	<div class="${"social-box__comment-container svelte-bz876m"}">${validate_component(MessageSquareIcon, "MessageSquareIcon").$$render($$result, { size: "24" }, {}, {})}
		<p class="${"social-box__social-text svelte-bz876m"}">Comentar</p></div></div>`;
    });
    css4 = {
      code: ".post__image.svelte-1363nm7.svelte-1363nm7{width:100%;height:400px;background-size:cover;background-repeat:no-repeat;background-position:center;position:relative;top:0;left:0}.post__image.svelte-1363nm7 .post__title-container.svelte-1363nm7{position:absolute;width:100%;background-color:rgba(0, 0, 0, 0.75);padding:10px;color:white;box-sizing:border-box;bottom:0}.post__image.svelte-1363nm7 .post__title-container .post__title.svelte-1363nm7{margin-bottom:10px}.post__image.svelte-1363nm7 .post__title-container .post__details.svelte-1363nm7{margin:0;display:flex;align-items:center;flex-wrap:wrap}.post__image.svelte-1363nm7 .post__title-container .post__details .post__details-time.svelte-1363nm7,.post__image.svelte-1363nm7 .post__title-container .post__details .post__details-reading-time.svelte-1363nm7,.post__image.svelte-1363nm7 .post__title-container .post__details .post__details-author.svelte-1363nm7{display:inline-flex;align-items:center}.post__content.svelte-1363nm7.svelte-1363nm7{padding:10px;transition:all ease 0.5s}.post__comments.svelte-1363nm7.svelte-1363nm7{margin:2em 0 0 0 0;padding:10px}",
      map: null
    };
    load4 = async ({ page, fetch: fetch2 }) => {
      const { params } = page;
      const res = await fetch2(`/blog/${params.slug}.json`);
      const post = await res.json();
      if (res.ok) {
        return { props: { post } };
      } else {
        new Error(post.message);
      }
    };
    U5Bslugu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { post } = $$props;
      let allHeadingTexts = [];
      let isStickySidebar = false;
      let isSocialToolBoxFloating = false;
      let postContentElement;
      let disqusElement;
      let windowWidth;
      getStores().page.subscribe(() => {
      });
      onDestroy(() => {
      });
      const onTemaryClick = (item) => {
        const { element } = allHeadingTexts.find((element2) => element2.innerText === item);
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        sendEventGA("post", "temary", "item-click");
      };
      if ($$props.post === void 0 && $$bindings.post && post !== void 0)
        $$bindings.post(post);
      $$result.css.add(css4);
      return `${$$result.head += `${$$result.title = `<title>${escape2(post.meta_title || post.title)}</title>`, ""}<meta name="${"description"}"${add_attribute("content", post.meta_description || post.excerpt, 0)} data-svelte="svelte-1avrfgv"><link rel="${"canonical"}" href="${"https://dartiles.dev/blog/" + escape2(post.slug)}" data-svelte="svelte-1avrfgv"><meta name="${"twitter:card"}" content="${"summary_large_image"}" data-svelte="svelte-1avrfgv"><meta name="${"twitter:site"}" content="${"@dartilesm"}" data-svelte="svelte-1avrfgv"><meta name="${"twitter:creator"}" content="${"@dartilesm"}" data-svelte="svelte-1avrfgv"><meta name="${"twitter:title"}"${add_attribute("content", post.meta_title || post.title, 0)} data-svelte="svelte-1avrfgv"><meta name="${"twitter:description"}"${add_attribute("content", post.meta_description || post.excerpt, 0)} data-svelte="svelte-1avrfgv"><meta name="${"twitter:image"}" content="${"https://dartiles.dev/" + escape2(post.image)}" data-svelte="svelte-1avrfgv"><meta property="${"og:title"}"${add_attribute("content", post.meta_title || post.title, 0)} data-svelte="svelte-1avrfgv"><meta property="${"og:site_name"}" content="${"dartiles.dev"}" data-svelte="svelte-1avrfgv"><meta property="${"og:description"}"${add_attribute("content", post.meta_description || post.excerpt, 0)} data-svelte="svelte-1avrfgv"><meta property="${"og:image"}" content="${"https://dartiles.dev/" + escape2(post.image)}" data-svelte="svelte-1avrfgv"><meta property="${"og:url"}" content="${"https://dartiles.dev/blog/" + escape2(post.slug)}" data-svelte="svelte-1avrfgv"><meta property="${"og:locale"}" content="${"es_ES"}" data-svelte="svelte-1avrfgv"><meta property="${"og:type"}" content="${"article"}" data-svelte="svelte-1avrfgv">`, ""}



${validate_component(GridLayout2Fr, "GridLayout").$$render($$result, {}, {}, {
        "fr-2": () => `${validate_component(Sidebar, "Sidebar").$$render($$result, {
          slot: "fr-2",
          currentPost: post,
          temary: allHeadingTexts,
          onTemaryClick,
          isStickySidebar,
          showTemary: windowWidth > 992
        }, {}, {})}`,
        "fr-1": () => `<div slot="${"fr-1"}"><div class="${"post__image svelte-1363nm7"}" style="${"background-image: url(/" + escape2(post.image) + ")"}"><div class="${"post__title-container svelte-1363nm7"}"><h1 class="${"post__title svelte-1363nm7"}">${escape2(post.title)}</h1>
				<div class="${"post__details svelte-1363nm7"}"><span class="${"post__details-author svelte-1363nm7"}">${validate_component(UserIcon, "UserIcon").$$render($$result, { size: "20" }, {}, {})}
						\xA0\xA0${escape2(post.primary_author?.name)}</span>
					\xA0\xA0\u2022\xA0\xA0
					<time class="${"post__details-time svelte-1363nm7"}"${add_attribute("datetime", post.published_at, 0)}>${validate_component(CalendarIcon, "CalendarIcon").$$render($$result, { size: "20" }, {}, {})}
						\xA0\xA0${escape2(timeFormatter(post.published_at))}\xA0\xA0
					</time>
					<span class="${"post__details-reading-time svelte-1363nm7"}">${validate_component(BookOpenIcon, "BookOpenIcon").$$render($$result, { size: "20" }, {}, {})}
						\xA0\xA0${escape2(readingTime(post.html))}</span></div></div></div>
		<div class="${"post__content svelte-1363nm7"}"${add_attribute("this", postContentElement, 0)}><!-- HTML_TAG_START -->${`${post.html}`}<!-- HTML_TAG_END --></div>
		${validate_component(SocialToolbox, "SocialToolbox").$$render($$result, {
          commentsElement: disqusElement,
          text: post.meta_title || post.title,
          postUrl: "https://dartiles.dev/blog/" + post.slug,
          twitterUsername: "dartilesm",
          hashtags: post.primary_tag.slug,
          isFloating: isSocialToolBoxFloating
        }, {}, {})}
		<div class="${"post__comments svelte-1363nm7"}"><div id="${"disqus_thread"}"${add_attribute("this", disqusElement, 0)}></div></div></div>`
      })}`;
    });
  }
});

// .svelte-kit/output/server/chunks/app-e5785616.js
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function custom_event(type, detail, bubbles = false) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, false, detail);
  return e;
}
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
function escape2(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped2[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(context || (parent_component ? parent_component.$$.context : [])),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css22) => css22.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape2(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
function set_paths(paths) {
  base = paths.base;
  assets = paths.assets || base;
}
function set_prerendering(value) {
}
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  const hooks = get_hooks(user_hooks);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: assets + "/_app/start-2f823ee2.js",
      css: [assets + "/_app/assets/start-61d1577b.css"],
      js: [assets + "/_app/start-2f823ee2.js", assets + "/_app/chunks/vendor-b9d0e3a8.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => assets + "/_app/" + entry_lookup[id],
    get_stack: (error2) => String(error2),
    handle_error: (error2, request) => {
      hooks.handleError({ error: error2, request });
      error2.stack = options.get_stack(error2);
    },
    hooks,
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
async function load_component(file) {
  const { entry, css: css22, js, styles } = metadata_lookup[file];
  return {
    module: await module_lookup[file](),
    entry: assets + "/_app/" + entry,
    css: css22.map((dep) => assets + "/_app/" + dep),
    js: js.map((dep) => assets + "/_app/" + dep),
    styles
  };
}
function render(request, {
  prerender: prerender2
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender: prerender2 });
}
var import_cookie6, current_component, escaped2, missing_component, on_destroy, css5, Root, base, assets, handle, user_hooks, template, options, default_settings, d, empty, manifest, get_hooks, module_lookup, metadata_lookup;
var init_app_e5785616 = __esm({
  ".svelte-kit/output/server/chunks/app-e5785616.js"() {
    init_shims();
    init_ssr();
    import_cookie6 = __toModule(require_cookie());
    init_dist();
    Promise.resolve();
    escaped2 = {
      '"': "&quot;",
      "'": "&#39;",
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;"
    };
    missing_component = {
      $$render: () => ""
    };
    css5 = {
      code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
      map: null
    };
    Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { stores } = $$props;
      let { page } = $$props;
      let { components } = $$props;
      let { props_0 = null } = $$props;
      let { props_1 = null } = $$props;
      let { props_2 = null } = $$props;
      setContext("__svelte__", stores);
      afterUpdate(stores.page.notify);
      if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
        $$bindings.stores(stores);
      if ($$props.page === void 0 && $$bindings.page && page !== void 0)
        $$bindings.page(page);
      if ($$props.components === void 0 && $$bindings.components && components !== void 0)
        $$bindings.components(components);
      if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
        $$bindings.props_0(props_0);
      if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
        $$bindings.props_1(props_1);
      if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
        $$bindings.props_2(props_2);
      $$result.css.add(css5);
      {
        stores.page.set(page);
      }
      return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
        default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
          default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
        })}` : ``}`
      })}

${``}`;
    });
    base = "";
    assets = "";
    handle = async ({ request, resolve: resolve2 }) => {
      const cookies = import_cookie6.default.parse(request.headers.cookie || "");
      request.locals.userid = cookies.userid || v4();
      if (request.query.has("_method")) {
        request.method = request.query.get("_method").toUpperCase();
      }
      const response = await resolve2(request);
      if (!cookies.userid) {
        response.headers["set-cookie"] = import_cookie6.default.serialize("userid", request.locals.userid, {
          path: "/",
          httpOnly: true
        });
      }
      return response;
    };
    user_hooks = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      [Symbol.toStringTag]: "Module",
      handle
    });
    template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		' + head + '\n		<meta charset="utf-8" />\n		<meta name="description" content="Svelte demo app" />\n		<link rel="icon" href="/favicon1.png" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n	</head>\n	<body>\n		<div id="svelte">' + body + `</div>

		<script async src="https://www.googletagmanager.com/gtag/js?id=G-YRFV05RX8C"><\/script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments);}
			gtag('js', new Date());

			gtag('config', 'G-YRFV05RX8C');
		<\/script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.22.0/prism.min.js" integrity="sha512-9+422Bs3A87UkWfp+qV80Nfv9arhbCXKY1rxrF2seorI36mIIstMiuBfyKLF1yH1nnzQkEWq2xrzT4XU3Z+vrA==" crossorigin="anonymous"><\/script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.22.0/components/prism-jsx.min.js" integrity="sha512-QORDihY3o14OZOxXmZxNbdPo4XkiD98/Wt/D8PQG5va4gLb63ZnCanJORVfpzetcJX/Dz4TTFT/I3oRe8O1/Sw==" crossorigin="anonymous"><\/script>
	</body>
</html>
`;
    options = null;
    default_settings = { paths: { "base": "", "assets": "" } };
    d = (s2) => s2.replace(/%23/g, "#").replace(/%3[Bb]/g, ";").replace(/%2[Cc]/g, ",").replace(/%2[Ff]/g, "/").replace(/%3[Ff]/g, "?").replace(/%3[Aa]/g, ":").replace(/%40/g, "@").replace(/%26/g, "&").replace(/%3[Dd]/g, "=").replace(/%2[Bb]/g, "+").replace(/%24/g, "$");
    empty = () => ({});
    manifest = {
      assets: [{ "file": "css/highlight-code.css", "size": 5566, "type": "text/css" }, { "file": "facebook-icon.png", "size": 771, "type": "image/png" }, { "file": "favicon.png", "size": 1571, "type": "image/png" }, { "file": "favicon1.png", "size": 32907, "type": "image/png" }, { "file": "favicon2.png", "size": 22966, "type": "image/png" }, { "file": "favicon3.png", "size": 13226, "type": "image/png" }, { "file": "fonts/FiraCode-Regular.ttf", "size": 299152, "type": "font/ttf" }, { "file": "fonts/FiraCode-Retina.ttf", "size": 295252, "type": "font/ttf" }, { "file": "globals.css", "size": 2258, "type": "text/css" }, { "file": "instagram-icon.png", "size": 3112, "type": "image/png" }, { "file": "logo-192.png", "size": 6052, "type": "image/png" }, { "file": "logo-512.png", "size": 13974, "type": "image/png" }, { "file": "logo.png", "size": 32907, "type": "image/png" }, { "file": "logo2.png", "size": 10448, "type": "image/png" }, { "file": "logo3.png", "size": 37450, "type": "image/png" }, { "file": "manifest.json", "size": 332, "type": "application/json" }, { "file": "media/about-me/me.jpg", "size": 645840, "type": "image/jpeg" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/2020-09-coding.jpg", "size": 47418, "type": "image/jpeg" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/2020-09-frontend.jpg", "size": 136845, "type": "image/jpeg" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/2020-09-linkedin.jpg", "size": 173335, "type": "image/jpeg" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/2020-09-responsive.jpg", "size": 171842, "type": "image/jpeg" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/aprende-mas-sobre-los-frontend-developers.png", "size": 47288, "type": "image/png" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/size-w1000-2020-09-frontend.jpg", "size": 66775, "type": "image/jpeg" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/size-w1000-2020-09-linkedin.jpg", "size": 126689, "type": "image/jpeg" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/size-w1000-2020-09-responsive.jpg", "size": 59849, "type": "image/jpeg" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/size-w1600-2020-09-frontend.jpg", "size": 135081, "type": "image/jpeg" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/size-w1600-2020-09-responsive.jpg", "size": 124472, "type": "image/jpeg" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/size-w600-2020-09-coding.jpg", "size": 35358, "type": "image/jpeg" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/size-w600-2020-09-frontend.jpg", "size": 28572, "type": "image/jpeg" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/size-w600-2020-09-linkedin.jpg", "size": 53207, "type": "image/jpeg" }, { "file": "media/blog/aprende-mas-sobre-los-frontend-developers/size-w600-2020-09-responsive.jpg", "size": 28158, "type": "image/jpeg" }, { "file": "media/blog/como-funciona-el-hook-usestate-y-como-usarlos-con-arrays-y-objetos/como-funciona-el-hook-usestate-y-como-usarlos-con-arrays-y-objetos.png", "size": 37151, "type": "image/png" }, { "file": "media/blog/cosas-que-quizas-no-sabias-de-react/2020-11-image.png", "size": 15386, "type": "image/png" }, { "file": "media/blog/cosas-que-quizas-no-sabias-de-react/cosas-que-quizas-no-sabias-de-react.png", "size": 39256, "type": "image/png" }, { "file": "media/blog/cosas-que-quizas-no-sabias-de-react/size-w600-2020-11-image.png", "size": 27645, "type": "image/png" }, { "file": "media/blog/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react/2020-11-ActivateEmmet.gif", "size": 1110619, "type": "image/gif" }, { "file": "media/blog/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react/2020-11-ActivateEmmet2.gif", "size": 1176010, "type": "image/gif" }, { "file": "media/blog/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react/2020-11-Emmet-Components.gif", "size": 987143, "type": "image/gif" }, { "file": "media/blog/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react/2020-11-WithEmmet.gif", "size": 1094150, "type": "image/gif" }, { "file": "media/blog/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react/2020-11-WithoutEmmet.gif", "size": 572450, "type": "image/gif" }, { "file": "media/blog/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react/escribe-codigo-jsx-mas-rapido-como-activar-emmet-en-react.png", "size": 214815, "type": "image/png" }, { "file": "media/blog/novedades-de-ecmascript-2020-o-es11/novedades-de-ecmascript-2020-o-es11.png", "size": 252724, "type": "image/png" }, { "file": "media/blog/optional-chaining-without-es11-safely-access/optional-chaining-without-es11-safely-access.png", "size": 29253, "type": "image/png" }, { "file": "media/blog/useeffect-react-hooks-ciclos-de-vida/useeffect-react-hooks-ciclos-de-vida.png", "size": 33611, "type": "image/png" }, { "file": "media/github-icon.png", "size": 2467, "type": "image/png" }, { "file": "media/main/main-image.jpg", "size": 100041, "type": "image/jpeg" }, { "file": "robots.txt", "size": 66, "type": "text/plain" }, { "file": "rss.xml", "size": 7307, "type": "application/xml" }, { "file": "sitemap.xml", "size": 1367, "type": "application/xml" }, { "file": "successkid.jpg", "size": 78652, "type": "image/jpeg" }, { "file": "svelte-welcome.png", "size": 360807, "type": "image/png" }, { "file": "svelte-welcome.webp", "size": 115470, "type": "image/webp" }, { "file": "svelte.png", "size": 1276, "type": "image/png" }],
      layout: "src/routes/__layout.svelte",
      error: ".svelte-kit/build/components/error.svelte",
      routes: [
        {
          type: "page",
          pattern: /^\/$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "endpoint",
          pattern: /^\/blog\.json$/,
          params: empty,
          load: () => Promise.resolve().then(() => (init_index_json_5960a6cc(), index_json_5960a6cc_exports))
        },
        {
          type: "page",
          pattern: /^\/blog\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/blog/index.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "endpoint",
          pattern: /^\/blog\/([^/]+?)\.json$/,
          params: (m) => ({ slug: d(m[1]) }),
          load: () => Promise.resolve().then(() => (init_slug_json_0c60619d(), slug_json_0c60619d_exports))
        },
        {
          type: "page",
          pattern: /^\/blog\/([^/]+?)\/?$/,
          params: (m) => ({ slug: d(m[1]) }),
          a: ["src/routes/__layout.svelte", "src/routes/blog/[slug].svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        }
      ]
    };
    get_hooks = (hooks) => ({
      getSession: hooks.getSession || (() => ({})),
      handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
      handleError: hooks.handleError || (({ error: error2 }) => console.error(error2.stack)),
      externalFetch: hooks.externalFetch || fetch
    });
    module_lookup = {
      "src/routes/__layout.svelte": () => Promise.resolve().then(() => (init_layout_00749fbd(), layout_00749fbd_exports)),
      ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(() => (init_error_ed2c1f6f(), error_ed2c1f6f_exports)),
      "src/routes/index.svelte": () => Promise.resolve().then(() => (init_index_724c00c4(), index_724c00c4_exports)),
      "src/routes/blog/index.svelte": () => Promise.resolve().then(() => (init_index_fc32fa53(), index_fc32fa53_exports)),
      "src/routes/blog/[slug].svelte": () => Promise.resolve().then(() => (init_slug_9cf6d69e(), slug_9cf6d69e_exports))
    };
    metadata_lookup = { "src/routes/__layout.svelte": { "entry": "pages/__layout.svelte-9c548275.js", "css": ["assets/pages/__layout.svelte-c3557fdd.css"], "js": ["pages/__layout.svelte-9c548275.js", "chunks/vendor-b9d0e3a8.js", "chunks/analytics-68a27184.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "error.svelte-17437498.js", "css": [], "js": ["error.svelte-17437498.js", "chunks/vendor-b9d0e3a8.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-9e1fb98d.js", "css": ["assets/pages/index.svelte-299cc9a3.css", "assets/PostItem-659c3dab.css"], "js": ["pages/index.svelte-9e1fb98d.js", "chunks/vendor-b9d0e3a8.js", "chunks/PostItem-0c7b0de3.js"], "styles": [] }, "src/routes/blog/index.svelte": { "entry": "pages/blog/index.svelte-80aaa161.js", "css": [], "js": ["pages/blog/index.svelte-80aaa161.js", "chunks/vendor-b9d0e3a8.js"], "styles": [] }, "src/routes/blog/[slug].svelte": { "entry": "pages/blog/_slug_.svelte-7af02a87.js", "css": ["assets/pages/blog/_slug_.svelte-2bba3eba.css", "assets/PostItem-659c3dab.css"], "js": ["pages/blog/_slug_.svelte-7af02a87.js", "chunks/vendor-b9d0e3a8.js", "chunks/PostItem-0c7b0de3.js", "chunks/analytics-68a27184.js"], "styles": [] } };
  }
});

// .svelte-kit/vercel/entry.js
__export(exports, {
  default: () => entry_default
});
init_shims();

// node_modules/@sveltejs/kit/dist/node.js
init_shims();
function getRawBody(req) {
  return new Promise((fulfil, reject) => {
    const h = req.headers;
    if (!h["content-type"]) {
      return fulfil(null);
    }
    req.on("error", reject);
    const length = Number(h["content-length"]);
    if (isNaN(length) && h["transfer-encoding"] == null) {
      return fulfil(null);
    }
    let data2 = new Uint8Array(length || 0);
    if (length > 0) {
      let offset = 0;
      req.on("data", (chunk) => {
        const new_len = offset + Buffer.byteLength(chunk);
        if (new_len > length) {
          return reject({
            status: 413,
            reason: 'Exceeded "Content-Length" limit'
          });
        }
        data2.set(chunk, offset);
        offset = new_len;
      });
    } else {
      req.on("data", (chunk) => {
        const new_data = new Uint8Array(data2.length + chunk.length);
        new_data.set(data2, 0);
        new_data.set(chunk, data2.length);
        data2 = new_data;
      });
    }
    req.on("end", () => {
      fulfil(data2);
    });
  });
}

// .svelte-kit/output/server/app.js
init_shims();
init_ssr();
init_app_e5785616();
var import_cookie7 = __toModule(require_cookie());
init_dist();

// .svelte-kit/vercel/entry.js
init();
var entry_default = async (req, res) => {
  const { pathname, searchParams } = new URL(req.url || "", "http://localhost");
  let body;
  try {
    body = await getRawBody(req);
  } catch (err) {
    res.statusCode = err.status || 400;
    return res.end(err.reason || "Invalid request body");
  }
  const rendered = await render({
    method: req.method,
    headers: req.headers,
    path: pathname,
    query: searchParams,
    rawBody: body
  });
  if (rendered) {
    const { status, headers, body: body2 } = rendered;
    return res.writeHead(status, headers).end(body2);
  }
  return res.writeHead(404).end();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
/*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
