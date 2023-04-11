/**
 * Интерфейс, который должны реализовывать все сторы, жизненный цикл которых включает
 * инициализацию (активацию) и деактивацию
 */

export interface IActivateDeactivate<Args extends any[]> {
  /**
   * Вызывается перед использованием стора.
   */
  activate: (...args: Args) => void
  /**
   * Вызывается после окончания использования стора.
   */
  deactivate: () => void

  /**
   * Можно использовать, чтобы избежать повторных активаций
   */
  isActivated: boolean
}