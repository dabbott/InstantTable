import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Separator,
  Table,
  TextField,
  Theme,
} from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";

import { id, init, transact, tx, useQuery } from "@instantdb/react";
import { PlusCircledIcon, TrashIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";

const APP_ID = "6a0e56c8-f847-4890-8ae9-06bba6249d34";

init({
  appId: APP_ID,
  websocketURI: "wss://api.instantdb.com/runtime/session",
});

type TablesData = {
  tables: { id: string; name?: string; rows?: TableRow[] }[];
};
type TableRow = { id: string; name?: string; company?: string };

function EditableCell({
  isEditing,
  onEdit,
  value,
  onSubmit,
  onCancel,
  placeholder,
}: {
  isEditing: boolean;
  onEdit: () => void;
  value?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      ref.current?.focus();
      // Select all
      ref.current?.setSelectionRange(0, ref.current.value.length);
    }
  }, [isEditing]);

  return (
    <Table.Cell
      onClick={onEdit}
      style={{
        background: isEditing ? "var(--blue-2)" : "none",
      }}
    >
      <Flex>
        <input
          ref={ref}
          type="text"
          readOnly={!isEditing}
          onFocus={onEdit}
          onBlur={onCancel}
          style={{
            appearance: "none",
            border: "none",
            margin: "0",
            padding: "0",
            background: "none",
            outline: "none",
            color: "black",
            width: "0",
            flex: "1",
            fontSize: "var(--font-size-2)",
            lineHeight: "var(--line-height-2)",
          }}
          defaultValue={value}
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit(event.currentTarget.value);
            } else if (event.key === "Escape") {
              // Blur and deselect
              event.currentTarget.setSelectionRange(0, 0);
              ref.current?.blur();
            }
          }}
        />
      </Flex>
    </Table.Cell>
  );
}

function CurrentTable({ tableId }: { tableId: string }) {
  const currentTable = useQuery({
    tables: {
      rows: {},
      $: {
        where: {
          id: tableId,
        },
      },
    },
  }) as {
    isLoading: boolean;
    data: TablesData;
  };

  const [editingCell, setEditingCell] = useState<
    { rowId: string; columnId: string } | undefined
  >();

  if (currentTable.isLoading) return <></>;

  const fields = ["name", "company"] as const;

  return (
    <Table.Root variant="surface" size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell width="10px">#</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Company</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell width="0"></Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {(currentTable.data.tables[0].rows ?? []).map((row, i) => {
          return (
            <Table.Row key={row.id}>
              <Table.RowHeaderCell
                style={{
                  backgroundColor: "var(--gray-a2)",
                  // tabular-nums
                  fontVariantNumeric: "tabular-nums",
                  borderRight: "1px solid var(--gray-a4)",
                }}
              >
                {i}
              </Table.RowHeaderCell>
              {fields.map((columnId) => {
                return (
                  <EditableCell
                    key={columnId}
                    isEditing={
                      editingCell?.rowId === row.id &&
                      editingCell?.columnId === columnId
                    }
                    onEdit={() => {
                      setEditingCell({ rowId: row.id, columnId: columnId });
                    }}
                    value={row[columnId]}
                    onSubmit={(value) => {
                      transact([tx.rows[row.id].update({ [columnId]: value })]);
                      setEditingCell(undefined);
                    }}
                    onCancel={() => {
                      setEditingCell(undefined);
                    }}
                    placeholder={
                      columnId.slice(0, 1).toUpperCase() + columnId.slice(1)
                    }
                  />
                );
              })}
              <Table.Cell>
                <Box px="1">
                  <Button
                    size="1"
                    variant="ghost"
                    style={{
                      position: "relative",
                      top: "2px",
                    }}
                    onClick={() => {
                      transact([tx.rows[row.id].delete()]);
                    }}
                  >
                    <TrashIcon color="var(--gray-10)" />
                  </Button>
                </Box>
              </Table.Cell>
            </Table.Row>
          );
        })}
        <Table.Row>
          <Table.RowHeaderCell></Table.RowHeaderCell>
          <Table.Cell>
            <Button
              m="0"
              size="1"
              onClick={() => {
                const rowId = id();

                transact([tx.rows[rowId].update({}).link({ tables: tableId })]);
              }}
            >
              Add Row
            </Button>
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  );
}

export default function App() {
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>();
  const [isEditingTableName, setIsEditingTableName] = useState<
    string | undefined
  >();

  const tables = useQuery({
    tables: {
      rows: {},
    },
  }) as {
    isLoading: boolean;
    data: TablesData;
  };

  // Select first table after loading
  useEffect(() => {
    if (
      !selectedTableId &&
      !tables.isLoading &&
      tables.data.tables.length > 0
    ) {
      const id = tables.data.tables[0].id;
      setSelectedTableId(id);
    }
  }, [selectedTableId, tables]);

  return (
    <Theme>
      <Container size="3" p="8">
        <Flex direction="column">
          <Heading align="center">Welcome to InstantTable</Heading>
          <Flex direction="row" gap="3" width="100%" mt="6">
            <Flex
              direction="column"
              align="stretch"
              gap="2"
              style={{
                width: "200px",
              }}
            >
              {!tables.isLoading &&
                tables.data.tables.map((table) => {
                  const isSelected = selectedTableId === table.id;
                  return (
                    <Button
                      key={table.id}
                      onClick={() => {
                        setSelectedTableId(table.id);
                      }}
                      variant={isSelected ? "solid" : "soft"}
                    >
                      {isEditingTableName && isSelected ? (
                        <TextField.Root variant="soft">
                          <TextField.Input
                            variant="soft"
                            placeholder="Untitled"
                            defaultValue={table.name}
                            autoFocus
                            style={{
                              color: "white",
                              background: "rgba(255,255,255,0.1)",
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                setIsEditingTableName(undefined);

                                transact([
                                  tx.tables[table.id].update({
                                    name: event.currentTarget.value,
                                  }),
                                ]);
                              }
                            }}
                          />
                        </TextField.Root>
                      ) : (
                        table.name || "Untitled"
                      )}
                    </Button>
                  );
                })}
              {!tables.isLoading && tables.data.tables.length > 0 && (
                <Separator size="4" color="gray" />
              )}
              <Button
                variant="surface"
                onClick={() => {
                  const tableId = id();
                  transact([tx.tables[tableId].update({})]);
                  setSelectedTableId(tableId);
                  setIsEditingTableName(tableId);
                }}
              >
                Create Table <PlusCircledIcon />
              </Button>
            </Flex>
            <Flex grow="1" direction="column" gap="4">
              {!tables.isLoading && selectedTableId && (
                <CurrentTable tableId={selectedTableId} />
              )}
              <Flex gap="2">
                <Button
                  color="green"
                  variant="surface"
                  onClick={() => {
                    setIsEditingTableName(selectedTableId);
                  }}
                >
                  Rename Table
                </Button>
                <Button
                  color="red"
                  variant="surface"
                  onClick={() => {
                    if (!selectedTableId) return;
                    transact([tx.tables[selectedTableId].delete()]);
                    setSelectedTableId(undefined);
                    setIsEditingTableName(undefined);
                  }}
                >
                  Delete Table
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </Theme>
  );
}
