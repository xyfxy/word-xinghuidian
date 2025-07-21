type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastOptions {
  duration?: number
  position?: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

class Toast {
  private container: HTMLDivElement | null = null

  private getContainer(): HTMLDivElement {
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.className = 'fixed top-4 right-4 z-50 space-y-2'
      document.body.appendChild(this.container)
    }
    return this.container
  }

  private show(message: string, type: ToastType, options: ToastOptions = {}) {
    const { duration = 3000 } = options
    const container = this.getContainer()

    const toast = document.createElement('div')
    toast.className = `max-w-sm p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-white' :
      'bg-blue-500 text-white'
    }`

    toast.textContent = message
    container.appendChild(toast)

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full')
    }, 10)

    // Auto remove
    setTimeout(() => {
      toast.classList.add('translate-x-full')
      setTimeout(() => {
        container.removeChild(toast)
        if (container.children.length === 0 && this.container) {
          document.body.removeChild(this.container)
          this.container = null
        }
      }, 300)
    }, duration)
  }

  success(message: string, options?: ToastOptions) {
    this.show(message, 'success', options)
  }

  error(message: string, options?: ToastOptions) {
    this.show(message, 'error', options)
  }

  info(message: string, options?: ToastOptions) {
    this.show(message, 'info', options)
  }

  warning(message: string, options?: ToastOptions) {
    this.show(message, 'warning', options)
  }
}

export const toast = new Toast()