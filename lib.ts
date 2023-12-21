export type BeforeInterceptorFunc = (
  url: string,
  options: EnhancedRequestInit,
) => Promise<{ url: string; options: EnhancedRequestInit }>;

export type AfterInterceptorFunc = (
  response: Response,
  json?: Record<string, any>,
) => Promise<Record<string, any>>;

/**
 * Enhanced `Error` class for preserving the stack trace if another error has been thrown before
 * and for collecting information about the HTTP response status.
 */
export class EnhancedFetchError extends Error {
  status?: number;
  statusText?: string;

  constructor(message: string, status?: number, statusText?: string, stack?: string) {
    super(message);
    this.status = status;
    this.statusText = statusText;
    if (stack) this.stack = stack;
    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Enhanced fetch options type.
 */
export type EnhancedRequestInit = RequestInit & {
  /** The data object to be sent as JSON. */
  data?: Record<string, any>;
  /**
   * The plain object to be serialized into query string. Params that are
   * null or undefined are not rendered in the URL. Array values of the
   * form foo=['a', 'b'] become foo=a&foo=b.
   */
  params?: Record<string, any>;
  /** The maximum time in milliseconds to wait for the response. */
  timeout?: number;
  /**
   * Function to be executed before making the fetch call.
   * @param url
   * @param options
   * @returns The updated url and options as new object
   */
  beforeInterceptor?: BeforeInterceptorFunc;
  /**
   * Function to be executed after receiving the fetch response.
   * @param response The native fetch response
   * @param json The transformed JSON object
   * @returns Either a JSON object or it throws an `EnhancedFetchError`
   */
  afterInterceptor?: AfterInterceptorFunc;
};

/**
 * Calls the native fetch API with the following enhanced features:
 * - Automatic query string serialization from a params object.
 * - Automatic JSON serialization if data object is provided.
 * - Automatic setting of Content-Type header to application/json if data object is provided.
 * - Automatic transformation of JSON response.
 * - Allows setting a before and after interceptor function.
 * - Customizable response timeout.
 *
 * @param url The URL to request.
 * @param options The enhanced fetch options object. Supports code completion for all native fetch options.
 * @returns Returns a promise with the result of the fetch call (parsed JSON body) or throws an `EnhancedFetchError`.
 */
export async function enhancedFetch(url: string, options?: EnhancedRequestInit): Promise<any> {
  options = options ?? {};
  // Extracting additional options
  const { params, timeout = 30000, beforeInterceptor, afterInterceptor } = options;

  // If data object is provided, serialize it as JSON
  if (options.data) {
    options.body = JSON.stringify(options.data);
    options.headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };
  }

  // Serialize params into query string and attach to the URL
  if (params) {
    const queryString = serializeParams(params);
    url += (url.includes("?") ? "&" : "?") + queryString;
  }

  // Execute the before interceptor if provided
  if (beforeInterceptor && typeof beforeInterceptor === "function") {
    const result = await beforeInterceptor(url, options);
    if (result && result.url && result.options) {
      url = result.url;
      options = result.options;
    }
  }

  // Setting timeout for the fetch call
  const abortController = new AbortController();
  options.signal = abortController.signal;
  const timeoutId = setTimeout(() => abortController.abort(), timeout);

  // Execute the fetch call
  let response: Response;
  try {
    response = await fetch(url, options);
    clearTimeout(timeoutId);
  } catch (err) {
    // AbortError or TypeError (e.g. invalid fetch options or network error)
    if ((err instanceof DOMException && err.name === "AbortError") || err instanceof TypeError) {
      throw new EnhancedFetchError(err.message, undefined, undefined, err.stack);
    }
    throw err;
  }

  // Check if response status is within the range of 200-299
  if (response.ok) {
    // Parse JSON response to object
    if (response.headers.get("Content-Type")?.includes("application/json")) {
      const result = await response.json();

      // Execute the after interceptor if provided
      if (afterInterceptor && typeof afterInterceptor === "function") {
        return await afterInterceptor(response, result);
      }

      return result;
    } else {
      throw new EnhancedFetchError("Response Content-Type is unsupported");
    }
  } else {
    // Execute the after interceptor if provided
    if (afterInterceptor && typeof afterInterceptor === "function") {
      await afterInterceptor(response, {});
    }
    throw new EnhancedFetchError(
      "Response status out of 200-299 range",
      response.status,
      response.statusText,
    );
  }
}

/**
 * Serializes an object into a query string.
 * @param params The object to be serialized.
 * @returns The serialized query string.
 */
function serializeParams(params: Record<string, any>): string {
  const parts = [];

  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;

    if (Array.isArray(value)) {
      value.forEach((v) => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }

  return parts.join("&");
}
