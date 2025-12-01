declare module '@umoteam/viewer' {
  import { Component } from 'vue'

  export const UmoViewer: Component

  export interface ViewerOptions {
    // Add specific options as needed
    [key: string]: any
  }

  export default UmoViewer
}
