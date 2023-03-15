export type InstallSnapResult = Record<
  string,
  {
    blocked: boolean
    enabled: boolean
    permissionName: string
    id: string
    initialPermissions: Record<string, unknown>
    version: string
  }
>
