import React, { useState, useRef } from 'react';
import { Tree, Dropdown, Modal, Form, Input, Select, message, Menu } from 'antd';
import { ExclamationCircleOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';
import type { DataNode, TreeProps } from 'antd/es/tree';
import type { MenuProps } from 'antd/es/menu';
import { useTranslations } from 'next-intl';
import styles from './CategoryTree.module.css';

interface CategoryNode {
  id: number;
  name: string;
  superCategoryId?: number;
  children?: CategoryNode[];
}

interface CategoryTreeProps {
  data: CategoryNode[];
  onCategoriesChange?: () => void;
}

interface TreeNodeData extends DataNode {
  title: string;
  key: string | number;
  children?: TreeNodeData[];
  parentId?: number | null;
  isEditing?: boolean;
}

export default function CategoryTree({ data, onCategoriesChange }: CategoryTreeProps) {
  const t = useTranslations('CategoriesPage');
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isDragConfirmModalVisible, setIsDragConfirmModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragInfo, setDragInfo] = useState<{ dragNode: any; dropNode: any; dropPosition: number } | null>(null);
  const [form] = Form.useForm();
  const [editingNodeKey, setEditingNodeKey] = useState<string | number | null>(null);
  const [editingNodeValue, setEditingNodeValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<(string | number)[]>([]);
  const inputRef = useRef<Input>(null);
  const nameInputRef = useRef<Input>(null);
  const initialLoadRef = useRef(true);

  // Convert category data to tree format
  React.useEffect(() => {
    const convertToTreeData = (nodes: CategoryNode[]): TreeNodeData[] =>
      nodes.map((n) => ({
        title: n.name,
        key: n.id,
        parentId: n.superCategoryId,
        children: n.children ? convertToTreeData(n.children) : [],
      }));
    
    const newTreeData = convertToTreeData(data);
    setTreeData(newTreeData);
    
    // Set all keys as expanded on initial load
    if (initialLoadRef.current && newTreeData.length > 0) {
      const getAllKeys = (nodes: TreeNodeData[]): (string | number)[] => {
        let keys: (string | number)[] = [];
        nodes.forEach(node => {
          keys.push(node.key);
          if (node.children && node.children.length > 0) {
            keys = [...keys, ...getAllKeys(node.children)];
          }
        });
        return keys;
      };
      
      setExpandedKeys(getAllKeys(newTreeData));
      initialLoadRef.current = false;
    }
  }, [data]);

  // Get full path of a category
  const getCategoryFullPath = (nodeKey: string | number, nodes: TreeNodeData[] = treeData): string => {
    for (const node of nodes) {
      if (node.key === nodeKey) {
        return node.title;
      }
      if (node.children) {
        const path = getCategoryFullPath(nodeKey, node.children);
        if (path) {
          return `${node.title} > ${path}`;
        }
      }
    }
    return '';
  };

  // Get parent full path of a category
  const getParentFullPath = (nodeKey: string | number, nodes: TreeNodeData[] = treeData): string => {
    for (const node of nodes) {
      if (node.children) {
        for (const child of node.children) {
          if (child.key === nodeKey) {
            return node.title;
          }
        }
        const path = getParentFullPath(nodeKey, node.children);
        if (path) {
          return path;
        }
      }
    }
    return '';
  };

  // Find node by key
  const findNodeByKey = (key: string | number, nodes: TreeNodeData[] = treeData): TreeNodeData | null => {
    for (const node of nodes) {
      if (node.key === key) {
        return node;
      }
      if (node.children) {
        const foundNode = findNodeByKey(key, node.children);
        if (foundNode) {
          return foundNode;
        }
      }
    }
    return null;
  };

  // Find parent node by child key
  const findParentNode = (childKey: string | number, nodes: TreeNodeData[] = treeData): TreeNodeData | null => {
    for (const node of nodes) {
      if (node.children) {
        for (const child of node.children) {
          if (child.key === childKey) {
            return node;
          }
        }
        const foundParent = findParentNode(childKey, node.children);
        if (foundParent) {
          return foundParent;
        }
      }
    }
    return null;
  };

  // Update tree data when a node is edited
  const updateTreeData = (list: TreeNodeData[], key: string | number, value: Partial<TreeNodeData>): TreeNodeData[] => {
    return list.map(node => {
      if (node.key === key) {
        return { ...node, ...value };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children, key, value),
        };
      }
      return node;
    });
  };

  // Handle right click on tree node
  const handleRightClick = ({ event, node }: { event: React.MouseEvent; node: any }) => {
    event.preventDefault();
    setSelectedNode(node);
    setContextMenuPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  // Handle click outside context menu
  React.useEffect(() => {
    const handleClickOutside = () => {
      setContextMenuPosition(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Delete category
  const handleDeleteCategory = async () => {
    if (!selectedNode) return;
    
    try {
      const response = await fetch(`/api/categories/${selectedNode.key}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
      
      message.success(t('categoryDeleted'));
      setIsDeleteModalVisible(false);
      onCategoriesChange?.();
    } catch (error) {
      console.error('Error deleting category:', error);
      setIsDeleteModalVisible(false);
      setErrorMessage(error instanceof Error ? error.message : 'Помилка видалення категорії');
      setIsErrorModalVisible(true);
    }
  };

  // Edit category
  const handleEditCategory = async (values: { name: string; superCategoryId: number | null }) => {
    if (!selectedNode) return;
    
    try {
      const response = await fetch(`/api/categories/${selectedNode.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          superCategoryId: values.superCategoryId || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update category');
      }
      
      message.success(t('categoryUpdated'));
      setIsEditModalVisible(false);
      form.resetFields();
      onCategoriesChange?.();
    } catch (error) {
      console.error('Error updating category:', error);
      setIsEditModalVisible(false);
      setErrorMessage(error instanceof Error ? error.message : 'Помилка оновлення категорії');
      setIsErrorModalVisible(true);
    }
  };

  // Add category
  const handleAddCategory = async (values: { name: string; superCategoryId: number | null }) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          superCategoryId: values.superCategoryId || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add category');
      }
      
      message.success(t('categoryAdded'));
      setIsAddModalVisible(false);
      form.resetFields();
      onCategoriesChange?.();
    } catch (error) {
      console.error('Error adding category:', error);
      setIsAddModalVisible(false);
      setErrorMessage(error instanceof Error ? error.message : 'Помилка додавання категорії');
      setIsErrorModalVisible(true);
    }
  };

  // Start rename
  const handleStartRenaming = () => {
    if (!selectedNode) return;
    
    setEditingNodeKey(selectedNode.key);
    setEditingNodeValue(selectedNode.title as string);
    setContextMenuPosition(null);
    
    // Focus the input after rendering
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Save rename
  const handleSaveRename = async () => {
    if (!editingNodeKey || !editingNodeValue.trim()) return;
    
    try {
      const response = await fetch(`/api/categories/${editingNodeKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingNodeValue,
          superCategoryId: findNodeByKey(editingNodeKey)?.parentId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to rename category');
      }
      
      message.success(t('categoryRenamed'));
      setEditingNodeKey(null);
      onCategoriesChange?.();
    } catch (error) {
      console.error('Error renaming category:', error);
      setEditingNodeKey(null);
      setErrorMessage(error instanceof Error ? error.message : 'Помилка перейменування категорії');
      setIsErrorModalVisible(true);
    }
  };

  // Cancel rename
  const handleCancelRename = () => {
    setEditingNodeKey(null);
  };

  // Handle drag and drop
  const onDrop: TreeProps['onDrop'] = (info) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
    
    // Store drag info for confirmation
    setDragInfo({
      dragNode: info.dragNode,
      dropNode: info.node,
      dropPosition,
    });
    
    setIsDragConfirmModalVisible(true);
  };

  // Confirm drag and drop
  const handleConfirmDragDrop = async () => {
    if (!dragInfo) return;
    
    const { dragNode, dropNode, dropPosition } = dragInfo;
    const dragKey = dragNode.key;
    const dropKey = dropNode.key;
    
    try {
      // If dropPosition is 0, we're dropping onto the node (making it a child)
      // Otherwise, we're dropping next to the node (as a sibling)
      const newParentId = dropPosition === 0 ? dropKey : dropNode.parentId;
      
      const response = await fetch(`/api/categories/${dragKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: dragNode.title,
          superCategoryId: newParentId || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to move category');
      }
      
      message.success(t('categoryMoved'));
      setIsDragConfirmModalVisible(false);
      onCategoriesChange?.();
    } catch (error) {
      console.error('Error moving category:', error);
      setIsDragConfirmModalVisible(false);
      setErrorMessage(error instanceof Error ? error.message : 'Помилка переміщення категорії');
      setIsErrorModalVisible(true);
    }
  };

  // Handle expand/collapse
  const onExpand = (expandedKeysValue: React.Key[]) => {
    setExpandedKeys(expandedKeysValue);
  };

  // Context menu items
  const menuItems: MenuProps['items'] = [
    {
      key: 'delete',
      label: t('deleteCategory'),
      disabled: !selectedNode,
      onClick: () => {
        setIsDeleteModalVisible(true);
        setContextMenuPosition(null);
      },
    },
    {
      key: 'edit',
      label: t('editCategory'),
      disabled: !selectedNode,
      onClick: () => {
        if (selectedNode) {
          form.setFieldsValue({
            name: selectedNode.title,
            superCategoryId: selectedNode.parentId,
          });
          setIsEditModalVisible(true);
          setContextMenuPosition(null);
          
          // Focus name input after modal is visible
          setTimeout(() => {
            nameInputRef.current?.focus();
          }, 100);
        }
      },
    },
    {
      key: 'add',
      label: t('addCategory'),
      onClick: () => {
        form.setFieldsValue({
          name: '',
          superCategoryId: selectedNode?.key || null,
        });
        setIsAddModalVisible(true);
        setContextMenuPosition(null);
        
        // Focus name input after modal is visible
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 100);
      },
    },
    {
      key: 'rename',
      label: t('renameCategory'),
      disabled: !selectedNode,
      onClick: handleStartRenaming,
    },
  ];

  // Prepare category options for select dropdown
  const getCategoryOptions = (nodes: TreeNodeData[] = treeData, currentNodeKey?: string | number): { value: number; label: string }[] => {
    let options: { value: number; label: string }[] = [
      { value: 0, label: t('noParent') },
    ];
    
    const addOptions = (nodes: TreeNodeData[], path = '') => {
      for (const node of nodes) {
        // Skip the current node and its children to prevent circular references
        if (node.key !== currentNodeKey) {
          const nodePath = path ? `${path} > ${node.title}` : node.title as string;
          options.push({ value: Number(node.key), label: nodePath });
          
          if (node.children && node.key !== currentNodeKey) {
            addOptions(node.children, nodePath);
          }
        }
      }
    };
    
    addOptions(nodes);
    return options;
  };

  // Custom title render for tree nodes
  const renderTitle = (node: TreeNodeData) => {
    if (editingNodeKey === node.key) {
      return (
        <div className="node-editing">
          <Input
            ref={inputRef}
            value={editingNodeValue}
            onChange={(e) => setEditingNodeValue(e.target.value)}
            onPressEnter={handleSaveRename}
            style={{ width: 'auto', marginRight: 8 }}
          />
          <CheckOutlined
            onClick={handleSaveRename}
            style={{ color: 'green', marginRight: 4 }}
          />
          <CloseOutlined
            onClick={handleCancelRename}
            style={{ color: 'red' }}
          />
        </div>
      );
    }
    return <span>{node.title}</span>;
  };

  return (
    <div onContextMenu={(e) => e.preventDefault()} className={styles.categoryTree}>
      <Tree
        treeData={treeData}
        expandedKeys={expandedKeys}
        onExpand={onExpand}
        draggable
        blockNode
        showLine={{ showLeafIcon: false }}
        onRightClick={handleRightClick}
        onDrop={onDrop}
        titleRender={renderTitle}
        onSelect={(selectedKeys) => {
          if (selectedKeys.length > 0) {
            const node = findNodeByKey(selectedKeys[0]);
            if (node) {
              setSelectedNode(node);
            }
          }
        }}
      />
      
      {contextMenuPosition && (
        <div
          style={{
            position: 'fixed',
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            zIndex: 1000,
            boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
            background: 'white',
            borderRadius: '2px',
          }}
        >
          <Menu items={menuItems} />
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal
        title={t('confirm')}
        open={isDeleteModalVisible}
        onOk={handleDeleteCategory}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText={t('yes')}
        cancelText={t('no')}
        okButtonProps={{ style: { color: '#fff', background: '#1890ff' } }}
      >
        <p>
          {t('deleteConfirmation')} {selectedNode && getCategoryFullPath(selectedNode.key)}?
        </p>
      </Modal>
      
      {/* Edit Category Modal */}
      <Modal
        title={t('editCategory')}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditCategory}
        >
          <Form.Item
            name="name"
            label={t('categoryName')}
            rules={[{ required: true, message: t('categoryNameRequired') }]}
          >
            <Input ref={nameInputRef} />
          </Form.Item>
          <Form.Item
            name="superCategoryId"
            label={t('parentCategory')}
          >
            <Select
              options={getCategoryOptions(treeData, selectedNode?.key)}
              placeholder={t('selectParent')}
            />
          </Form.Item>
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsEditModalVisible(false)}
                style={{ marginRight: 8 }}
              >
                {t('cancel')}
              </button>
              <button type="submit">
                {t('save')}
              </button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Add Category Modal */}
      <Modal
        title={t('addCategory')}
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddCategory}
        >
          <Form.Item
            name="name"
            label={t('categoryName')}
            rules={[{ required: true, message: t('categoryNameRequired') }]}
          >
            <Input ref={nameInputRef} />
          </Form.Item>
          <Form.Item
            name="superCategoryId"
            label={t('parentCategory')}
          >
            <Select
              options={getCategoryOptions()}
              placeholder={t('selectParent')}
            />
          </Form.Item>
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsAddModalVisible(false)}
                style={{ marginRight: 8 }}
              >
                {t('cancel')}
              </button>
              <button type="submit">
                {t('save')}
              </button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Drag and Drop Confirmation Modal */}
      <Modal
        title={t('confirm')}
        open={isDragConfirmModalVisible}
        onOk={handleConfirmDragDrop}
        onCancel={() => setIsDragConfirmModalVisible(false)}
        okText={t('yes')}
        cancelText={t('no')}
        okButtonProps={{ style: { color: '#fff', background: '#1890ff' } }}
      >
        {dragInfo && (
          <p>
            {t('moveConfirmation')} {dragInfo.dragNode.title}{' '}
            {t('from')} {getParentFullPath(dragInfo.dragNode.key) || t('rootCategory')}{' '}
            {t('to')} {dragInfo.dropPosition === 0 ? dragInfo.dropNode.title : (getParentFullPath(dragInfo.dropNode.key) || t('rootCategory'))}?
          </p>
        )}
      </Modal>

      {/* Error Modal */}
      <Modal
        title="Помилка"
        open={isErrorModalVisible}
        onOk={() => setIsErrorModalVisible(false)}
        onCancel={() => setIsErrorModalVisible(false)}
        footer={[
          <button 
            key="ok" 
            onClick={() => setIsErrorModalVisible(false)}
            style={{ 
              padding: '4px 15px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            OK
          </button>
        ]}
      >
        <p>{errorMessage}</p>
      </Modal>
    </div>
  );
}
