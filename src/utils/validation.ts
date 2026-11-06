import { Types } from 'mongoose';

export function isValidObjectId(id: string | undefined | null): boolean {
  return !!id && /^[0-9a-fA-F]{24}$/.test(id) && Types.ObjectId.isValid(id);
}

export class HttpError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

type Source = Record<string, any>;

interface StringOpts {
  required?: boolean;
  min?: number;
  max?: number;
  trim?: boolean;
}

interface NumberOpts {
  required?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
  nullable?: boolean;
}

/**
 * Accumule les erreurs de validation d'un payload puis les remonte en une seule 400.
 * Les méthodes renvoient `undefined` quand le champ est absent (mise à jour partielle).
 */
export class Checker {
  readonly errors: Record<string, string> = {};

  constructor(private readonly path = '') {}

  private fail(field: string, message: string): undefined {
    this.errors[this.path + field] = message;
    return undefined;
  }

  string(src: Source, field: string, opts: StringOpts = {}): string | undefined {
    const value = src[field];
    if (value === undefined || value === null) {
      if (opts.required) this.fail(field, 'Champ obligatoire');
      return undefined;
    }
    if (typeof value !== 'string') return this.fail(field, 'Doit être une chaîne');
    const out = opts.trim === false ? value : value.trim();
    if (opts.required && !out) return this.fail(field, 'Ne doit pas être vide');
    if (opts.min !== undefined && out.length < opts.min) return this.fail(field, `Minimum ${opts.min} caractères`);
    if (opts.max !== undefined && out.length > opts.max) return this.fail(field, `Maximum ${opts.max} caractères`);
    return out;
  }

  nullableString(src: Source, field: string, max = 500): string | null | undefined {
    if (src[field] === null) return null;
    return this.string(src, field, { max });
  }

  number(src: Source, field: string, opts: NumberOpts = {}): number | null | undefined {
    const value = src[field];
    if (value === undefined) {
      if (opts.required) this.fail(field, 'Champ obligatoire');
      return undefined;
    }
    if (value === null) {
      if (opts.nullable) return null;
      if (opts.required) this.fail(field, 'Champ obligatoire');
      return undefined;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) return this.fail(field, 'Doit être un nombre');
    if (opts.integer && !Number.isInteger(value)) return this.fail(field, 'Doit être un entier');
    if (opts.min !== undefined && value < opts.min) return this.fail(field, `Minimum ${opts.min}`);
    if (opts.max !== undefined && value > opts.max) return this.fail(field, `Maximum ${opts.max}`);
    return value;
  }

  boolean(src: Source, field: string): boolean | undefined {
    const value = src[field];
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'boolean') return this.fail(field, 'Doit être un booléen');
    return value;
  }

  enum<T extends string>(src: Source, field: string, allowed: readonly T[], required = false): T | undefined {
    const value = src[field];
    if (value === undefined || value === null) {
      if (required) this.fail(field, 'Champ obligatoire');
      return undefined;
    }
    if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
      return this.fail(field, `Valeur attendue : ${allowed.join(', ')}`);
    }
    return value as T;
  }

  enumArray<T extends string>(src: Source, field: string, allowed: readonly T[]): T[] | undefined {
    const value = src[field];
    if (value === undefined || value === null) return undefined;
    if (!Array.isArray(value)) return this.fail(field, 'Doit être un tableau');
    const invalid = value.filter((v) => typeof v !== 'string' || !(allowed as readonly string[]).includes(v));
    if (invalid.length) return this.fail(field, `Valeurs invalides : ${invalid.join(', ')}`);
    return [...new Set(value as T[])];
  }

  stringArray(src: Source, field: string, maxItems = 200): string[] | undefined {
    const value = src[field];
    if (value === undefined || value === null) return undefined;
    if (!Array.isArray(value)) return this.fail(field, 'Doit être un tableau');
    if (value.length > maxItems) return this.fail(field, `Maximum ${maxItems} éléments`);
    if (value.some((v) => typeof v !== 'string' || !v)) return this.fail(field, 'Doit contenir des chaînes non vides');
    return [...new Set(value as string[])];
  }

  array(src: Source, field: string, opts: { required?: boolean; max?: number } = {}): any[] | undefined {
    const value = src[field];
    if (value === undefined || value === null) {
      if (opts.required) this.fail(field, 'Champ obligatoire');
      return undefined;
    }
    if (!Array.isArray(value)) return this.fail(field, 'Doit être un tableau');
    if (opts.max !== undefined && value.length > opts.max) return this.fail(field, `Maximum ${opts.max} éléments`);
    return value;
  }

  object(src: Source, field: string, required = false): Source | undefined {
    const value = src[field];
    if (value === undefined || value === null) {
      if (required) this.fail(field, 'Champ obligatoire');
      return undefined;
    }
    if (typeof value !== 'object' || Array.isArray(value)) return this.fail(field, 'Doit être un objet');
    return value;
  }

  child(prefix: string): Checker {
    const child = new Checker(this.path + prefix);
    return Object.assign(child, { errors: this.errors });
  }

  get hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  done(): void {
    if (this.hasErrors) throw new HttpError(400, 'Données invalides', this.errors);
  }
}

/** Retire les clés `undefined` pour construire des `$set` partiels. */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
