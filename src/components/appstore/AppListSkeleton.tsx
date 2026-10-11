import Card from '@douyinfe/semi-ui/lib/es/card'
import Skeleton from '@douyinfe/semi-ui/lib/es/skeleton'
import type { AppStoreTab } from '../../types/appstore'

export function AppListSkeleton({ tab, count }: { tab: AppStoreTab; count: number }) {
  const installed = tab === 'installed'

  return (
    <div
      aria-hidden="true"
      className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="h-full" bodyStyle={{ height: '100%' }} style={{ minWidth: 0 }}>
          <Skeleton
            active
            loading
            style={{ height: '100%' }}
            placeholder={
              <div className="flex h-full min-w-0 flex-col gap-4">
                <div className="flex items-start gap-3">
                  <Skeleton.Avatar
                    shape="square"
                    className="shrink-0"
                    style={{ borderRadius: 'var(--semi-border-radius-medium)' }}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Skeleton.Title style={{ width: '70%', height: 20 }} />
                    <Skeleton.Title style={{ width: '45%', height: 16 }} />
                  </div>
                  {installed && <Skeleton.Title style={{ width: 56, height: 20 }} />}
                </div>
                {installed ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 rounded-(--semi-border-radius-medium) bg-(--semi-color-fill-0) p-3">
                      {[0, 1].map((field) => (
                        <div key={field} className="flex min-w-0 flex-col gap-1.5">
                          <Skeleton.Title style={{ width: '60%', height: 18 }} />
                          <Skeleton.Title style={{ width: '40%', height: 18 }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Skeleton.Button style={{ width: 80 }} />
                      <Skeleton.Button style={{ width: 96 }} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex min-h-10 flex-col gap-2">
                      <Skeleton.Title style={{ height: 16 }} />
                      <Skeleton.Title style={{ width: '80%', height: 16 }} />
                    </div>
                    <div className="flex min-h-5 flex-wrap gap-1.5">
                      <Skeleton.Button style={{ width: 56, height: 20 }} />
                      <Skeleton.Button style={{ width: 72, height: 20 }} />
                    </div>
                  </>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-(--semi-color-border) pt-3">
                  {installed ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Skeleton.Button style={{ width: 56 }} />
                        <Skeleton.Button style={{ width: 72 }} />
                      </div>
                      <Skeleton.Button style={{ width: 72 }} />
                    </>
                  ) : (
                    <>
                      <Skeleton.Button style={{ width: 112 }} />
                      <Skeleton.Button style={{ width: 80 }} />
                    </>
                  )}
                </div>
              </div>
            }
          />
        </Card>
      ))}
    </div>
  )
}
