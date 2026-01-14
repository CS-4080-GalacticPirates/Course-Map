declare module 'better-sqlite3' {
  class Database {
    constructor(filename: string, options?: { readonly?: boolean });
    prepare(sql: string): {
      all(): any[];
      get(): any;
      run(...params: any[]): void;
    };
  }

  export default Database;
}
