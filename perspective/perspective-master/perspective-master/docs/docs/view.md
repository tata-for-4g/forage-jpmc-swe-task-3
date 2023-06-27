---
id: view
title: View
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The View is Perspective's query and serialization interface. It represents a
query on the `Table`'s dataset and is always created from an existing `Table`
instance via the `view()` method with a set of
[`View` configuration parameters](obj/perspective.md#module_perspective..table+view):

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const table = await perspective.table({
    id: [1, 2, 3, 4],
    name: ["a", "b", "c", "d"],
});

const view = await table.view({columns: ["name"]});
const json = await view.to_json();

view.delete();
```

</TabItem>
<TabItem value="python" label="Python">

```python
table = perspective.Table({
  "id": [1, 2, 3, 4],
  "name": ["a", "b", "c", "d"]
});

view = table.view(columns=["name"]);
arrow = view.to_arrow();
```

</TabItem>
</Tabs>

`View` objects are immutable with respect to the arguments provided to the
`view()` method; to change these parameters, you must create a new `View` on the
same `Table`. However, each `View` is _live_ with respect to the `Table`'s data,
and will (within a conflation window) update with the latest state as its parent
`Table` updates, including incrementally recalculating all aggregates, pivots,
filters, etc. `View` query parameters are composable, in that each parameter
works independently _and_ in conjunction with each other, and there is no limit
to the number of pivots, filters, etc. which can be applied.

> Examples in this section are live — play around with each
> `<perspective-viewer>` instance to see how different query parameters affect
> what you see!

### Querying data with `view()`

To query the table, create a `view()` on the table instance with an optional
configuration object. A `table()` can have as many `view()`s associated with it
as you need - Perspective conserves memory by relying on a single `table()` to
power multiple `view()`s concurrently:

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const view = await table.view({
    columns: ["Sales"],
    aggregates: {Sales: "sum"},
    group_by: ["Region", "Country"],
    filter: [["Category", "in", ["Furniture", "Technology"]]],
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
view = table.view(
  columns=["Sales"],
  aggregates={"Sales": "sum"},
  group_by=["Region", "Country"],
  filter=[["Category", "in", ["Furniture", "Technology"]]]
)
```

</TabItem>
</Tabs>

See the [View API documentation](obj/perspective.md) for more details.

## Group By

A group by _groups_ the dataset by the unique values of each column used as a
group by - a close analogue in SQL to the `GROUP BY` statement. The underlying
dataset is aggregated to show the values belonging to each group, and a total
row is calculated for each group, showing the currently selected aggregated
value (e.g. `sum`) of the column. Group by are useful for hierarchies,
categorizing data and attributing values, i.e. showing the number of units sold
based on State and City. In Perspective, group by are represented as an array of
string column names to pivot, are applied in the order provided; For example, a
group by of `["State", "City", "Postal Code"]` shows the values for each Postal
Code, which are grouped by City, which are in turn grouped by State.

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const view = await table.view({group_by: ["a", "c"]});
```

</TabItem>
<TabItem value="python" label="Python">

```python
view = table.view(group_by=["a", "c"])
```

</TabItem>
</Tabs>

#### Example

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const elem = document.querySelector("perspective-viewer");
await elem.restore({
    group_by: ["State", "City"],
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
widget = PerspectiveWidget()
widget.restore(
  group_by=["State", "City"]
)
```

</TabItem>
</Tabs>

<div>
<perspective-viewer group_by='["State", "City"]' columns='["Sales", "Profit"]'>
</perspective-viewer>
</div>

## Split By

A split by _splits_ the dataset by the unique values of each column used as a
split by. The underlying dataset is not aggregated, and a new column is created
for each unique value of the split by. Each newly created column contains the
parts of the dataset that correspond to the column header, i.e. a `View` that
has `["State"]` as its split by will have a new column for each state. In
Perspective, Split By are represented as an array of string column names to
pivot:

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const view = await table.view({split_by: ["a", "c"]});
```

</TabItem>
<TabItem value="python" label="Python">

```python
view = table.view(split_by=["a", "c"])
```

</TabItem>
</Tabs>

#### Example

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const elem = document.querySelector("perspective-viewer");
await elem.restore({
    group_by: ["Category"],
    split_by: ["Region"],
    columns: ["Sales", "Profit"],
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
widget = PerspectiveWidget()
widget.restore(
  group_by=["Category"],
  split_by=["Region"],
  columns=["Sales", "Profit"]
)
```

</TabItem>
</Tabs>

<div>
<perspective-viewer group_by='["Category"]' split_by='["Region"]' columns='["Sales", "Profit"]'>
</perspective-viewer>
</div>

## Aggregates

Aggregates perform a calculation over an entire column, and are displayed when
one or more [Group By](#row-pivots) are applied to the `View`. Aggregates can be
specified by the user, or Perspective will use the following sensible default
aggregates based on column type:

-   "sum" for `integer` and `float` columns
-   "count" for all other columns

Perspective provides a selection of aggregate functions that can be applied to
columns in the `View` constructor using a dictionary of column name to aggregate
function name:

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const view = await table.view({
    aggregates: {
        a: "avg",
        b: "distinct count",
    },
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
view = table.view(
  aggregates={
    "a": "avg",
    "b": "distinct count"
  }
)
```

</TabItem>
</Tabs>

#### Example

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const elem = document.querySelector("perspective-viewer");
await elem.restore({
  aggregates: {"Sales": "avg", "Profit", "median"},
  group_by: ["State", "City"],
  columns: ["Sales", "Profit"]
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
widget = PerspectiveWidget()
widget.restore(
  aggregates={"Sales": "avg", "Profit", "median"},
  group_by=["State", "City"],
  columns=["Sales", "Profit"]
)
```

</TabItem>
</Tabs>

<div>
<perspective-viewer aggregates='{"Sales": "avg", "Profit": "median"}' group_by='["State", "City"]' columns='["Sales", "Profit"]'>
</perspective-viewer>
</div>

## Columns

The `columns` property specifies which columns should be included in the
`View`'s output. This allows users to show or hide a specific subset of columns,
as well as control the order in which columns appear to the user. This is
represented in Perspective as an array of string column names:

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const view = await table.view({
    columns: ["a"],
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
view = table.view(columns=["a"])
```

</TabItem>
</Tabs>

#### Example

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const elem = document.querySelector("perspective-viewer");
await elem.restore({
    columns: ["Sales", "Profit", "Segment"],
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
widget = PerspectiveWidget()
widget.restore(
  columns=["Sales", "Profit", "Segment"]
)
```

</TabItem>
</Tabs>

<div>
<perspective-viewer columns='["Sales", "Profit"]'>
</perspective-viewer>
</div>

## Sort

The `sort` property specifies columns on which the query should be sorted,
analogous to `ORDER BY` in SQL. A column can be sorted regardless of its data
type, and sorts can be applied in ascending or descending order. Perspective
represents `sort` as an array of arrays, with the values of each inner array
being a string column name and a string sort direction. When `column-pivots` are
applied, the additional sort directions `"col asc"` and `"col desc"` will
determine the order of pivot columns groups.

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const view = await table.view({
    sort: [["a", "asc"]],
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
view = table.view(sort=[["a", "asc"]])
```

</TabItem>
</Tabs>

#### Example

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const elem = document.querySelector("perspective-viewer");
await elem.restore({
    sort: [["Sales", "desc"]],
    columns: ["Sales", "Profit"],
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
widget = PerspectiveWidget()
widget.restore(
  sort=[["Sales", "desc"]],
  columns=["Sales", "Profit"]
)
```

</TabItem>
</Tabs>

<div>
<perspective-viewer columns='["Sales", "Profit"]' sort='[["Sales", "desc"]]'>
</perspective-viewer>
</div>

## Filter

The `filter` property specifies columns on which the query can be filtered,
returning rows that pass the specified filter condition. This is analogous to
the `WHERE` clause in SQL. There is no limit on the number of columns where
`filter` is applied, but the resulting dataset is one that passes all the filter
conditions, i.e. the filters are joined with an `AND` condition.

Perspective represents `filter` as an array of arrays, with the values of each
inner array being a string column name, a string filter operator, and a filter
operand in the type of the column:

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const view = await table.view({
    filter: [["a", "<", 100]],
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
view = table.view(filter=[["a", "<", 100]])
```

</TabItem>
</Tabs>

#### Example

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const elem = document.querySelector("perspective-viewer");
await elem.restore({
    columns: ["State", "Sales", "Profit"],
    filter: [["State", "==", "Texas"]],
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
widget = PerspectiveWidget()
widget.restore(
  columns=["Sales", "Profit"],
  filter=[["State", "==", "Texas"]]
)
```

</TabItem>
</Tabs>

<div>
<perspective-viewer columns='["State", "Sales", "Profit"]' filter='[["State","==","Texas"]]'>
</perspective-viewer>
</div>

## Expressions

The `expressions` property specifies _new_ columns in Perspective that are
created using existing column values or arbitary scalar values defined within
the expression. In `<perspective-viewer>`, expressions are added using the "New
Column" button in the side panel.

A custom name can be added to an expression by making the first line a comment:

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const view = await table.view({
    expressions: ['"a" + "b"'],
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
view = table.view(expressions=['"a" + "b"'])
```

</TabItem>
</Tabs>

#### Example

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const elem = document.querySelector("perspective-viewer");
await elem.restore({
    columns: ["new expression"],
    expressions: ['//new expression\n"Sales" + "Profit" * 50 / sqrt("Sales")'],
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
widget = PerspectiveWidget()
widget.restore(
  columns=["new_expression"],
  expressions=["//new expression\n\"Sales\" + \"Profit\" * 50 / sqrt(\"Sales\")"]
)
```

</TabItem>
</Tabs>

<div>
<perspective-viewer columns='["new expression"]' expressions='["//new expression\n\"Sales\" + \"Profit\" * 50 / sqrt(\"Sales\")"]'>
</perspective-viewer>
</div>

## Flattening a `view()` into a `table()`

In Javascript, a `table()` can be constructed on a `view()` instance, which will
return a new `table()` based on the `view()`'s dataset, and all future updates
that affect the `view()` will be forwarded to the new `table()`. This is
particularly useful for implementing a
[Client/Server Replicated](server.md#clientserver-replicated) design,
by serializing the `View` to an arrow and setting up an `on_update` callback:

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const worker1 = perspective.worker();
const table = await worker.table(data);
const view = await table.view({filter: [["State", "==", "Texas"]]});
const table2 = await worker.table(view);

table.update([{State: "Texas", City: "Austin"}]);
```

</TabItem>
<TabItem value="python" label="Python">

```python
table = perspective.Table(data);
view = table.view(filter=[["State", "==", "Texas"]])
table2 = perspective.Table(view.to_arrow());

def updater(port, delta):
    table2.update(delta)

view.on_update(updater, mode="Row")

table.update([{"State": "Texas", "City": "Austin"}])
```

</TabItem>
</Tabs>
