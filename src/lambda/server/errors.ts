export class ApplicationError extends Error {
  constructor(msg: string, public details: any) {
    super(msg);
  }
}
