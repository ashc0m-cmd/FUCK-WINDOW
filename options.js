const { InvalidArgumentError } = require('./error.js');
// @ts-check

class Option {
  /**
   * Initialize a new `Option` with the given `flags` and `description`.
   *
   * @param {string} flags
   * @param {string} [description]
   */
  constructor(flags, description) {
    this.flags = flags;
    this.description = description || '';

    // A value must be supplied when the option is specified.
    this.required = flags.includes('<');
    // A value is optional when the option is specified.
    this.optional = flags.includes('[');
    // The option can take multiple values. Matches e.g. "<value...>" or "[value...]" at end
    this.variadic = /\w\.\.\.[>\]]$/.test(flags);

    this.mandatory = false; // The option must have a value after parsing

    const optionFlags = splitOptionFlags(flags);
    this.short = optionFlags.shortFlag;
    this.long = optionFlags.longFlag;

    this.negate = false;
    if (this.long) {
      this.negate = this.long.startsWith('--no-');
    }

    this.defaultValue = undefined;
    this.defaultValueDescription = undefined;
    this.envVar = undefined;
    this.parseArg = undefined;
    this.hidden = false;
    this.argChoices = undefined;
  }

  default(value, description) {
    this.defaultValue = value;
    this.defaultValueDescription = description;
    return this;
  }

  env(name) {
    this.envVar = name;
    return this;
  }

  argParser(fn) {
    this.parseArg = fn;
    return this;
  }

  makeOptionMandatory(mandatory = true) {
    this.mandatory = !!mandatory;
    return this;
  }

  hideHelp(hide = true) {
    this.hidden = !!hide;
    return this;
  }

  _concatValue(value, previous) {
    if (previous === this.defaultValue || !Array.isArray(previous)) {
      return [value];
    }
    return previous.concat(value);
  }

  choices(values) {
    if (!Array.isArray(values)) {
      throw new TypeError('choices expects an array of allowed values');
    }

    this.argChoices = values;
    this.parseArg = (arg, previous) => {
      if (!values.includes(arg)) {
        throw new InvalidArgumentError(`Allowed choices are ${values.join(', ')}.`);
      }
      if (this.variadic) {
        return this._concatValue(arg, previous);
      }
      return arg;
    };
    return this;
  }

  name() {
    if (this.long) {
      return this.long.replace(/^--/, '');
    }
    return (this.short || '').replace(/^-/, '');
  }

  attributeName() {
    return camelcase(this.name().replace(/^no-/, ''));
  }

  is(arg) {
    return this.short === arg || this.long === arg;
  }
}

function camelcase(str) {
  if (!str || typeof str !== 'string') return '';
  const parts = str.split('-');
  return parts
    .map((part, idx) => {
      if (idx === 0) return part.toLowerCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

function splitOptionFlags(flags) {
  let shortFlag;
  let longFlag;

  const flagParts = flags.split(/[,\s]+/).filter(Boolean);

  if (flagParts.length > 1 && !/^[[<]/.test(flagParts[1])) {
    shortFlag = flagParts.shift();
  }

  longFlag = flagParts.shift();

  if (!shortFlag && /^-[^-]$/.test(longFlag)) {
    shortFlag = longFlag;
    longFlag = undefined;
  }

  return { shortFlag, longFlag };
}

module.exports = {
  Option,
  splitOptionFlags
};