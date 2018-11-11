/**
 * @module main
 */

 /*
* adonis-framework
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

export interface IConfig {
  get (key: string, defaultValue?: any): any
  merge (key: string, defaultValues: object, customizer?: Function): any
  set (key: string, value: any): void
  sync (): void
}
