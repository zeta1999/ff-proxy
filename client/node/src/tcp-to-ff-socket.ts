import net from "net";
import stream from "stream";
import FfClient from "./client";
import { STATUS_CODES } from "http";

export interface TcpToFfSocketOptions {
  https: boolean;
  mockResponse?: string | Buffer | number | undefined;
}

export class TcpToFfSocket extends stream.Duplex {
  bufferSize: number = 0;
  bytesRead: number = 0;
  bytesWritten: number = 0;
  connecting: boolean = false;
  localAddress: string = "";
  localPort: number = 0;
  remoteAddress?: string | undefined;
  remoteFamily?: string | undefined;
  remotePort?: number | undefined;

  constructor(
    public readonly ffClient: FfClient,
    public readonly options: TcpToFfSocketOptions
  ) {
    super();
  }

  connect(): this {
    throw new Error("Method not implemented.");
  }

  setTimeout(timeout: number, callback?: (() => void) | undefined): this {
    return this;
  }

  setNoDelay(noDelay?: boolean | undefined): this {
    throw new Error("Method not implemented.");
  }

  setKeepAlive(
    enable?: boolean | undefined,
    initialDelay?: number | undefined
  ): this {
    throw new Error("Method not implemented.");
  }

  address(): string | net.AddressInfo {
    throw new Error("Method not implemented.");
  }

  unref(): this {
    throw new Error("Method not implemented.");
  }

  ref(): this {
    throw new Error("Method not implemented.");
  }

  _write(
    chunk: any,
    encoding: string,
    callback: (error?: Error | null) => void
  ): void {
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, encoding as any);
    }

    this.ffClient
      .sendRequest({
        request: chunk,
        https: this.options.https
      })
      .then(() => {
        if (this.options.mockResponse) {
          this.emit(
            "data",
            this.normaliseMockResponse(this.options.mockResponse)
          );
        }
        this.emit("end");

        callback();
      })
      .catch(e => {
        callback(e);
      });
  }

  _read(size: number): void {}

  private normaliseMockResponse = (
    response: string | Buffer | number
  ): Buffer => {
    if (response instanceof Buffer) {
      return response;
    } else if (typeof response === "string") {
      return Buffer.from(response, "utf-8");
    } else if (typeof response === "number") {
      return Buffer.from(
        `HTTP/1.1 ${response} ${STATUS_CODES[response]}\n\n\n`
      );
    }

    throw new Error(`Unknown mockResponse type: ${typeof response}`);
  };
}
