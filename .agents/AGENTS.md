# Global Project Rules

## 1. Documentation Preservation (Do Not Forget Old Plans)
Whenever you are asked to update an implementation plan (`implementation_plan.md`) or any architectural document, you MUST:
1. First use `view_file` to read the current contents of the document.
2. Carefully **MERGE** or **APPEND** the new requirements into the existing document.
3. **NEVER** completely overwrite the document from scratch, as this causes previously approved logic, formatting rules, and context to be lost.

## 2. Strict Tally Auditing
Before generating any XML payload for Tally or attempting an import:
1. You must cross-reference all extracted Ledgers and Items against the Tally Masters (`tally_masters.xml`).
2. You must ensure the total number of processed JSON records exactly matches the total number of source PDF bills.
3. Halt and alert the user immediately if any Ledger/Item is missing from Tally, or if any bill is missing from the extraction.

## 3. Strict Folder Isolation
All work, scripts, and temporary files generated during a session MUST be isolated into a dedicated timestamped or versioned folder (e.g., `tally_integration_v2`) within the project, unless explicitly editing global configuration files.

## 4. Strict Business Logic
- **Room Numbers**: Single or double digit room numbers (e.g., 2, 02) must be translated to 100s (e.g., 102).
- **Complementary (CL)**: Any food bill containing the exact string "CL" must not be pushed as a standard Sale. It must be processed as 2 Journal Vouchers.

## 5. Global Synchronization (Super AI Rule)
Whenever ANY business logic, rule, or requirement is changed by the user, you MUST exhaustively update ALL linked files simultaneously. If you update the `implementation_plan.md`, you MUST also update the corresponding `SKILL.md` files, Node.js scripts, and JSON schemas in the exact same turn. Never leave an updated rule stranded in just one document.

## 6. Anti-Duplicate XML (Idempotent Import)
To prevent duplicate entries in Tally upon re-imports, the system MUST ALWAYS use `ACTION="Create"` and explicitly inject a deterministic `<GUID>` and `<REMOTEID>` into every voucher. In newer versions of Tally Prime, using `ACTION="Alter"` on a non-existent voucher causes a "Cannot delete unnamed object: VOUCHER!" exception. By using `ACTION="Create"` combined with a `<REMOTEID>`, Tally performs an upsert: it creates the voucher if it doesn't exist, and alters it if the REMOTEID is already present. This guarantees Tally overwrites the existing entry instead of duplicating it.
