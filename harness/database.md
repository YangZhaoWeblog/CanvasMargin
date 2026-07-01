> status: stub
> owner: data-storage
> layer: profile
> 本文件负责 database / migration 规则；不负责 Markdown、Canvas JSON 或 Obsidian plugin data。

# Database

当前项目没有 database、schema migration system 或 external persistence layer。

## Activation Condition

如果插件引入以下内容，再激活本文件：

- sidecar storage files；
- IndexedDB 或 SQLite；
- remote persistence；
- stored user data migration scripts。

## TODO When Activated

- 定义 storage ownership 和 file locations。
- 定义 forward/backward migration policy。
- 增加 user data backup / rollback expectation。
- 增加 automated 和 manual migration tests。
