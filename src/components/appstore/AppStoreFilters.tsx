import Button from '@douyinfe/semi-ui/lib/es/button'
import Checkbox from '@douyinfe/semi-ui/lib/es/checkbox'
import Input from '@douyinfe/semi-ui/lib/es/input'
import Select from '@douyinfe/semi-ui/lib/es/select'
import { IconSearch } from '@douyinfe/semi-icons'
import type { AppSearch, AppSource, AppStoreTab, AppTag } from '../../types/appstore'

interface Props {
  tab: AppStoreTab
  query: string
  search: AppSearch
  tags: AppTag[]
  tagError: string
  filtered: boolean
  onQueryChange: (value: string) => void
  onFilterChange: (values: Partial<AppSearch>) => void
  onClear: () => void
}

export function AppStoreFilters({
  tab,
  query,
  search,
  tags,
  tagError,
  filtered,
  onQueryChange,
  onFilterChange,
  onClear,
}: Props) {
  return (
    <div className="flex flex-col gap-3 border-t border-(--semi-color-border) p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full min-w-0 sm:min-w-56 sm:flex-1">
          <Input
            prefix={<IconSearch />}
            aria-label={tab === 'catalog' ? '搜索应用名称' : '搜索已安装的实例名称'}
            placeholder={tab === 'catalog' ? '搜索应用名称' : '搜索实例名称'}
            value={query}
            onChange={onQueryChange}
            onClear={() => onQueryChange('')}
            showClear
            composition
            style={{ width: '100%', borderRadius: 'var(--semi-border-radius-medium)' }}
          />
        </div>
        <div
          className={`grid w-full gap-3 sm:flex sm:w-auto ${tab === 'catalog' ? 'grid-cols-2' : 'grid-cols-1'}`}
        >
          <div className="min-w-0 sm:w-36">
            <Select
              aria-label="应用分类"
              placeholder="全部分类"
              value={search.tags[0] || ''}
              onChange={(value) => onFilterChange({ tags: value ? [value as string] : [] })}
              optionList={[
                { label: '全部分类', value: '' },
                ...tags.map((tag) => ({ label: tag.name, value: tag.key })),
              ]}
              filter
              style={{ width: '100%' }}
            />
          </div>
          {tab === 'catalog' && (
            <div className="min-w-0 sm:w-32">
              <Select
                aria-label="应用来源"
                value={search.resource}
                onChange={(value) => onFilterChange({ resource: value as AppSource })}
                optionList={[
                  { label: '全部来源', value: 'all' },
                  { label: '远程应用', value: 'remote' },
                  { label: '本地应用', value: 'local' },
                ]}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {tab === 'catalog' ? (
            <>
              <Checkbox
                checked={search.recommend}
                onChange={(event) => onFilterChange({ recommend: Boolean(event.target.checked) })}
              >
                仅推荐
              </Checkbox>
              <Checkbox
                checked={search.showCurrentArch}
                onChange={(event) =>
                  onFilterChange({ showCurrentArch: Boolean(event.target.checked) })
                }
              >
                适配当前架构
              </Checkbox>
            </>
          ) : (
            <Checkbox
              checked={search.update}
              onChange={(event) => onFilterChange({ update: Boolean(event.target.checked) })}
            >
              仅可升级
            </Checkbox>
          )}
          {filtered && (
            <Button theme="borderless" type="tertiary" onClick={onClear}>
              清除筛选
            </Button>
          )}
        </div>
      </div>
      {tagError && (
        <span className="text-xs text-(--semi-color-warning)" role="status">
          分类加载失败，可刷新重试
        </span>
      )}
    </div>
  )
}
