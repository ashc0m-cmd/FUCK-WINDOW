{
const { InvalidArgumentError } = require('./error.js');
// @ts-check
class Option {
  /**
   * Initialize a new `Option` with the given `flags` and `description`.
   *
   * @param {string} flags
   * @param {string} [description]
   */
  constructor(flags, description)
    this.flags = flags;
    this.description = description || '';
# Script: organize - files.ps1
# Copies listed files into an organized folder tree and shows the result.
# REVIEW DESTINATION BEFORE RUNNING.

        $destRoot = Join - Path $env:USERPROFILE "OneDrive\Documents\bypass-tech-organized"

# Map of source files(update if any path differs)
    $files = @(
        "C:\Users\Ashc0\OneDrive\Documents\bypass tech\README.md",
        "C:\Users\Ashc0\OneDrive\Documents\bypass tech\Fetch.json",
        "C:\Users\Ashc0\OneDrive\Documents\bypass tech\updates.json",
        "C:\Users\Ashc0\OneDrive\Documents\manifest.json\chemist\content_scripts.json",
        "C:\Users\Ashc0\OneDrive\Documents\manifest.json\chemist\index.json",
        "C:\Users\Ashc0\OneDrive\Documents\manifest.json\chemist\assets\shield.png",
        "C:\Users\Ashc0\OneDrive\Documents\manifest.json\chemist\option.js",
        "C:\Users\Ashc0\OneDrive\Documents\manifest.json\chemist\background.json",
        "C:\Users\Ashc0\OneDrive\Documents\manifest.json\chemist\style.css",
        "C:\Users\Ashc0\OneDrive\Documents\manifest.json\chemist\settings.json",
        "C:\Users\Ashc0\source\repos\chemtrail\config.json",
        "C:\Users\Ashc0\source\repos\chemtrail\manifest.json",
        "C:\Users\Ashc0\source\repos\sites.json",
        "C:\Users\Ashc0\source\repos\bypass ashc0m\.vs\bypass ashc0m.csproj.dtbcache.json",
        "C:\Users\Ashc0\source\repos\github_doc.py"
    )

# Destination subfolders(under $destRoot)
    $folders = @{
        "docs" = Join - Path $destRoot "docs"
    "manifest.json" = Join - Path $destRoot "manifests"
    "manifests\chemist" = Join - Path $destRoot "manifests\chemist"
    "assets" = Join - Path $destRoot "assets"
    "src" = Join - Path $destRoot "src"
    "configs" = Join - Path $destRoot "configs"
    "repos" = Join - Path $destRoot "repos"
    "repos\chemtrail" = Join - Path $destRoot "repos\chemtrail"
}

# Create destination folders
    foreach($f in $folders.Values) {
        if (-not(Test - Path $f)) { New - Item - Path $f - ItemType Directory - Force | Out - Null }
    }

    Write - Host "Destination root: $destRoot" - ForegroundColor Cyan

# Helper to copy to appropriate folder
    function Get-DestinationPath($src) {
        if ($src - match "\\manifest\.json\\chemist\\") { return $folders["manifests\chemist\assets"] }
        if ($src - match "\\manifest\.json\\chemist") { return $folders["manifests"] }
        if ($src - match "bypass tech" - and $src - match "\.md$") { return $folders["docs"] }
        if ($src - match "assets\\.*\.png$" - or $src - match "shield\.png$") { return $folders["assets"] }
        if ($src - match "\\source\\repos\\chemtrail\\") { return $folders["repos\chemtrail"] }
        if ($src - match "\\source\\repos\\") { return $folders["repos"] }
        if ($src - match "\.(js|css|json)$") { return $folders["src"] }
        return $folders["configs"]
    }

# Copy files(preserve names, overwrite if exists)
        foreach($s in $files) {
        if (-not(Test - Path $s)) {
            Write - Warning "Source not found: $s"
            continue
        }
        $destFolder = Get - DestinationPath $s
        $destPath = Join - Path $destFolder(Split - Path $s - Leaf)
        Copy - Item - Path $s - Destination $destPath - Force - Verbose
    }

# Show resulting tree(ASCII) and open Explorer
    Write - Host "`nDirectory tree for $destRoot:`n" - ForegroundColor Green
# Use cmd 'tree' for a readable tree; run as child process
    $treeCmd = "cmd.exe /c tree `"$destRoot`" /A /F"
Invoke-Expression $treeCmd

# Open the destination folder in Windows Explorer
Start-Process explorer.exe -ArgumentList $destRoot
Write-Host "`nOpened Explorer at: $destRoot" -ForegroundColor Cyan
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

  /**
   * Set the default value, and optionally supply the description to be displayed in the help.
   *
   * @param {any} value
   * @param {string} [description]
   * @return {Option}
   */
  default(value, description) {
    this.defaultValue = value;
    this.defaultValueDescription = description;
    return this;
  }

  /**
   * Set environment variable to check for option value.
   * Priority order of option values is default < env < cli
   *
   * @param {string} name
   * @return {Option}
   */
  env(name) {
    this.envVar = name;
    return this;
  }

  /**
   * Set the custom handler for processing CLI option arguments into option values.
   *
   * @param {Function} [fn]
   * @return {Option}
   */
  argParser(fn) {
    this.parseArg = fn;
    return this;
  }

  /**
   * Whether the option is mandatory and must have a value after parsing.
   *
   * @param {boolean} [mandatory=true]
   * @return {Option}
   */
  makeOptionMandatory(mandatory = true) {
    this.mandatory = !!mandatory;
    return this;
  }

  /**
   * Hide option in help.
   *
   * @param {boolean} [hide=true]
   * @return {Option}
   */
  hideHelp(hide = true) {
    this.hidden = !!hide;
    return this;
  }

  /**
   * @api private
   */
  _concatValue(value, previous) {
    if (previous === this.defaultValue || !Array.isArray(previous)) {
      return [value];
    }

    return previous.concat(value);
  }

  /**
   * Only allow option value to be one of choices.
   *
   * @param {string[]} values
   * @return {Option}
   */
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

  /**
   * Return option name.
   *
   * @return {string}
   */
  name() {
    if (this.long) {
      return this.long.replace(/^--/, '');
    }
    return (this.short || '').replace(/^-/, '');
  }

  /**
   * Return option name, in a camelcase format that can be used
   * as a object attribute key.
   *
   * @return {string}
   * @api private
   */
  attributeName() {
    // strip leading no- for negated options, then camelcase
    return camelcase(this.name().replace(/^no-/, ''));
  }

  /**
   * Check if `arg` matches the short or long flag.
   *
   * @param {string} arg
   * @return {boolean}
   * @api private
   */
  is(arg) {
    return this.short === arg || this.long === arg;
  }
}

/**
 * Convert string from kebab-case to camelCase.
 *
 * Examples:
 *  - "foo-bar" -> "fooBar"
 *  - "no-color" -> "noColor"
 *
 * @param {string} str
 * @return {string}
 * @api private
 */
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

/**
 * Split the short and long flag out of something like '-m,--mixed <value>'
 *
 * @param {string} flags
 * @return {{shortFlag: string|undefined, longFlag: string|undefined}}
 * @api private
 */
function splitOptionFlags(flags) {
  let shortFlag;
  let longFlag;
  // Use original very loose parsing to maintain backwards compatibility for now,
  // which allowed for example unintended `-sw, --short-word` [sic].
  // Split on comma or whitespace (one or more)
  const flagParts = flags.split(/[,\s]+/).filter(Boolean);
  if (flagParts.length > 1 && !/^[[<]/.test(flagParts[1])) shortFlag = flagParts.shift();
  longFlag = flagParts.shift();
  // Add support for lone short flag without significantly changing parsing!
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
