/**
 * @module main
 */

 /*
 * @adonisjs/framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { IConfig } from '../Contracts/IConfig'
import * as requireAll from 'require-all'
import { get, set, mergeWith } from 'lodash'

import Debug from 'debug'
const debug = Debug('adonis:config')

/**
 * Config module eases the process of using configuration inside your AdonisJs
 * applications.
 *
 * The config files are stored inside a seperate directory, which are loaded and cached
 * on application boot. Later you can access the values using the `dot` syntax.
 *
 * ## Access values
 *
 * 1. **Given the config file is stored as `config/app.js` with following content**
 *
 * ```js
 * module.exports = {
 *  appKey: ''
 * }
 * ```
 *
 * 2. **You access the appKey as follows**
 *
 * ```js
 * Config.get('app.appKey')
 * ```
 *
 * The `get` method doesn't raise runtime exceptions when top level objects are missing.
 *
 * ## Extensions
 * By default files ending with `js` extension are loaded. However, you can define a custom set of extensions as
 * an array.
 *
 * ## Parsing config files
 * Though you can define an array of extensions for the files to loaded. The config provider
 * doesn't parse them in any manner.
 *
 * For example: If your configuration files are in Typescript, then make sure to run the process
 * using `ts-node`.
 */
export class Config implements IConfig {
  private _configCache: object = {}

  constructor (private _configPath: string, private _extensions: string[] = ['js']) {
    this.sync()
  }

  /**
   * Sync the in-memory cache with the file system. This method synchronously
   * require files using the `require` method.
   */
  public sync () {
    debug('sync %s', this._configPath)
    debug('extensions %o', this._extensions)

    try {
      this._configCache = requireAll({
        dirname: this._configPath,
        filter: new RegExp(`(.*)\.(${this._extensions.join('|')})$`),
        recursive: true,
      })
    } catch (error) {
      /* istanbul ignore else */
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  /**
   * Read value from the pre-loaded config. Make use of the `dot notation`
   * syntax to read nested values.
   *
   * The `defaultValue` is returned when original value is `undefined`.
   *
   * @example
   * ```js
   * Config.get('database.mysql')
   * ```
   */
  public get (key: string, defaultValue?: any): any {
    return get(this._configCache, key, defaultValue)
  }

  /**
   * Fetch and merge an object to the existing config. This method is useful
   * when you are fetching an object from the config and want to merge
   * it with some default values.
   *
   * An optional customizer can be passed to customize the merge operation.
   * The function is directly passed to [lodash.mergeWith](https://lodash.com/docs/4.17.10#mergeWith)
   * method.
   *
   * @example
   * ```js
   * // Config inside the file will be merged with the given object
   *
   * Config.merge('database.mysql', {
   *   host: '127.0.0.1',
   *   port: 3306
   * })
   * ```
   */
  public merge (key: string, defaultValues: object, customizer?: Function): any {
    return mergeWith(defaultValues, this.get(key), customizer)
  }

  /**
   * Update in memory value of the pre-loaded config
   *
   * @example
   * ```js
   * Config.set('database.host', '127.0.0.1')
   * ```
   */
  public set (key: string, value: any): void {
    set(this._configCache, key, value)
  }
}
