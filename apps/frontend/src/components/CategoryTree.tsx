import React, { useState, useRef, useEffect } from 'react';
import { Tree, Dropdown, Modal, Form, Input, Select, message, Menu, Checkbox } from 'antd';
import { ExclamationCircleOutlined, CheckOutlined, CloseOutlined, DownOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';
import type { DataNode, TreeProps } from 'antd/es/tree';
import type { MenuProps } from 'antd/es/menu';
import { useTranslations } from 'next-intl';
import styles from './CategoryTree.module.css';
import ConfirmationDialog from './ConfirmationDialog';
import { Category } from '../types/Category';

interface TreeNodeData {
  key: React.Key;
  title: React.ReactNode;
  children?: TreeNodeData[];
  id?: number;
  parentId?: number | null;
}

interface CategoryTreeProps {
  data: any[]; // Backend data format
  onCategoriesChange?: () => void;
  onSelectCategory?: (category: Category | null) => void;
  moveWithoutConfirmation?: boolean;
  onMoveWithoutConfirmationChange?: (checked: boolean) => void;
}

export default function CategoryTree({ 
  data, 
  onCategoriesChange, 
  onSelectCategory,
  moveWithoutConfirmation = false,
  onMoveWithoutConfirmationChange
}: CategoryTreeProps) {
  const t = useTranslations('CategoriesPage');
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isDragConfirmModalVisible, setIsDragConfirmModalVisible] = useState(false);
  const [isMoveProductsModalVisible, setIsMoveProductsModalVisible] = useState(false);
  const [isMergeCategoryModalVisible, setIsMergeCategoryModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragInfo, setDragInfo] = useState<{ dragNode: any; dropNode: any; dropPosition: number } | null>(null);
  const [form] = Form.useForm();
  const [moveProductsForm] = Form.useForm();
  const [editingNodeKey, setEditingNodeKey] = useState<string | number | null>(null);
  const [editingNodeValue, setEditingNodeValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<(string | number)[]>([]);
  const inputRef = useRef<Input>(null);
  const nameInputRef = useRef<Input>(null);
  const initialLoadRef = useRef(true);

  // Convert category data to tree format
  React.useEffect(() => {
    const convertToTreeData = (nodes: any[]): TreeNodeData[] =>
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
        return node.title as string;
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
            return node.title as string;
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

  // Handle select
  const onSelect = (selectedKeys: React.Key[], info: any) => {
    if (selectedKeys.length > 0) {
      const selectedKey = selectedKeys[0];
      setSelectedNode(findNodeByKey(selectedKey));
      
      // Create a Category DTO with full path information
      const selectedId = Number(selectedKey);
      const selectedCategory = data.find(category => category.id === selectedId);
      
      if (selectedCategory) {
        // Build the path array of parent categories
        const pathCategories: Category[] = [];
        
        // Function to find all parent categories
        const findParentCategories = (categoryId: number, categories: any[]): boolean => {
          for (const category of categories) {
            if (category.id === categoryId) {
              return true;
            }
            
            if (category.children && category.children.length > 0) {
              const isParent = findParentCategories(categoryId, category.children);
              if (isParent) {
                // Add this category to the path
                const pathCategory: Category = {
                  id: category.id,
                  name: category.name,
                  path: [] // Path will be populated later
                };
                pathCategories.unshift(pathCategory);
                return true;
              }
            }
          }
          return false;
        };
        
        // Find the selected category's parent path
        if (selectedCategory.parentId) {
          findParentCategories(selectedCategory.parentId, data);
        }
        
        // Create the full Category DTO
        const categoryDTO: Category = {
          id: selectedCategory.id,
          name: selectedCategory.name,
          path: pathCategories
        };
        
        onSelectCategory?.(categoryDTO);
      } else {
        onSelectCategory?.(null);
      }
    } else {
      setSelectedNode(null);
      onSelectCategory?.(null);
    }
  };

  // Handle move products
  const handleMoveProducts = async (values: { targetCategoryId: number | null }) => {
    if (!selectedNode) return;
    
    try {
      const response = await fetch(`/api/products/move-category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceCategoryId: selectedNode.key,
          targetCategoryId: values.targetCategoryId || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to move products');
      }
      
      message.success(t('productsMoved'));
      setIsMoveProductsModalVisible(false);
      moveProductsForm.resetFields();
      onCategoriesChange?.();
    } catch (error) {
      console.error('Error moving products:', error);
      setIsMoveProductsModalVisible(false);
      setErrorMessage(error instanceof Error ? error.message : 'Помилка переносу продуктів');
      setIsErrorModalVisible(true);
    }
  };

  // Handle merge category
  const handleMergeCategory = async (values: { targetCategoryId: number | null }) => {
    if (!selectedNode) return;
    
    try {
      // First move all products
      const moveResponse = await fetch(`/api/products/move-category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceCategoryId: selectedNode.key,
          targetCategoryId: values.targetCategoryId || null,
        }),
      });
      
      if (!moveResponse.ok) {
        const errorData = await moveResponse.json();
        throw new Error(errorData.message || 'Failed to move products');
      }
      
      // Then delete the source category
      const deleteResponse = await fetch(`/api/categories/${selectedNode.key}`, {
        method: 'DELETE',
      });
      
      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
      
      message.success(t('categoryMerged'));
      setIsMergeCategoryModalVisible(false);
      moveProductsForm.resetFields();
      onCategoriesChange?.();
    } catch (error) {
      console.error('Error merging category:', error);
      setIsMergeCategoryModalVisible(false);
      setErrorMessage(error instanceof Error ? error.message : 'Помилка злиття категорії');
      setIsErrorModalVisible(true);
    }
  };

  // Add state for drag-and-drop product handling
  const [isDraggingProduct, setIsDraggingProduct] = useState(false);

  useEffect(() => {
    // Add global event listeners for product drag events
    const handleDragEnter = (e: DragEvent) => {
      const productData = e.dataTransfer?.types.includes('application/json');
      if (productData) {
        setIsDraggingProduct(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      if (e.target === document.documentElement) {
        setIsDraggingProduct(false);
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', () => setIsDraggingProduct(false));
    document.addEventListener('dragend', () => setIsDraggingProduct(false));

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', () => setIsDraggingProduct(false));
      document.removeEventListener('dragend', () => setIsDraggingProduct(false));
    };
  }, []);

  // Handle product drop on category
  const handleProductDrop = async (info: any) => {
    try {
      const productData = info.event.dataTransfer.getData('application/json');
      if (!productData) return;
      
      const product = JSON.parse(productData);
      const targetCategoryId = Number(info.node.key);
      
      // If the product is already in this category, do nothing
      if (product.categoryId === targetCategoryId) return;
      
      if (moveWithoutConfirmation) {
        // Skip confirmation and update directly
        await updateProductCategory(product.id, targetCategoryId);
      } else {
        // Show confirmation dialog
        setProductDropInfo({
          product,
          targetCategoryId,
          targetCategoryName: getCategoryNameById(targetCategoryId)
        });
        setIsProductDropModalVisible(true);
      }
    } catch (e: any) {
      message.error(e.message || t('errorOccurred'));
    }
  };

  // Update product category
  const updateProductCategory = async (productId: number, categoryId: number | null) => {
    try {
      const response = await fetch('/api/products/update-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          categoryId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(t('errorUpdatingProduct'));
      }
      
      message.success(t('productCategoryUpdated'));
    } catch (e: any) {
      message.error(e.message || t('errorOccurred'));
    }
  };

  // Handle confirm product drop
  const handleConfirmProductDrop = async () => {
    if (!productDropInfo) return;
    
    await updateProductCategory(productDropInfo.product.id, productDropInfo.targetCategoryId);
    setIsProductDropModalVisible(false);
    setProductDropInfo(null);
  };

  // Handle cancel product drop
  const handleCancelProductDrop = () => {
    setIsProductDropModalVisible(false);
    setProductDropInfo(null);
  };

  // Get confirmation message for product drop
  const getProductDropConfirmationMessage = () => {
    if (!productDropInfo) return '';
    
    const { product, targetCategoryId, targetCategoryName } = productDropInfo;
    
    if (product.categoryId === null) {
      // Adding to a category
      return t.raw('confirmAddToCategory')
        .replace('{productName}', product.name)
        .replace('{categoryName}', targetCategoryName);
    } else if (targetCategoryId === null) {
      // Removing from a category
      return t.raw('confirmRemoveFromCategory')
        .replace('{productName}', product.name)
        .replace('{categoryName}', getCategoryNameById(product.categoryId));
    } else {
      // Changing category
      return t.raw('confirmChangeCategory')
        .replace('{productName}', product.name)
        .replace('{sourceCategory}', getCategoryNameById(product.categoryId))
        .replace('{targetCategory}', targetCategoryName);
    }
  };

  // Add state for product drop confirmation
  const [isProductDropModalVisible, setIsProductDropModalVisible] = useState(false);
  const [productDropInfo, setProductDropInfo] = useState<{
    product: any;
    targetCategoryId: number | null;
    targetCategoryName: string;
  } | null>(null);

  // Get category name by ID
  const getCategoryNameById = (categoryId: number | null): string => {
    if (categoryId === null) {
      return t('noCategory');
    }
    
    const findCategoryName = (nodes: TreeNodeData[]): string => {
      for (const node of nodes) {
        if (Number(node.key) === categoryId) {
          return node.title as string;
        }
        if (node.children) {
          const name = findCategoryName(node.children);
          if (name) return name;
        }
      }
      return '';
    };
    
    const name = findCategoryName(treeData);
    return name || `${categoryId}`;
  };

  // Get full path of a category by its ID
  const getCategoryFullPathById = (categoryId: number | null): string => {
    if (categoryId === null) {
      return t('noCategory');
    }
    
    const path: string[] = [];
    
    const findPath = (nodes: TreeNodeData[], parentPath: string[] = []): boolean => {
      for (const node of nodes) {
        const currentPath = [...parentPath, node.title as string];
        
        if (Number(node.key) === categoryId) {
          path.push(...currentPath);
          return true;
        }
        
        if (node.children && findPath(node.children, currentPath)) {
          return true;
        }
      }
      return false;
    };
    
    findPath(treeData);
    
    return path.length > 0 ? path.join(' / ') : `${categoryId}`;
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
    {
      key: 'moveProducts',
      label: t('moveProducts'),
      disabled: !selectedNode,
      onClick: () => {
        if (selectedNode) {
          moveProductsForm.setFieldsValue({
            targetCategoryId: null,
          });
          setIsMoveProductsModalVisible(true);
          setContextMenuPosition(null);
        }
      },
    },
    {
      key: 'mergeCategory',
      label: t('mergeCategory'),
      disabled: !selectedNode,
      onClick: () => {
        if (selectedNode) {
          moveProductsForm.setFieldsValue({
            targetCategoryId: null,
          });
          setIsMergeCategoryModalVisible(true);
          setContextMenuPosition(null);
        }
      },
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
    return <span onDoubleClick={() => {
      setSelectedNode(node);
      handleStartRenaming();
    }}>{node.title}</span>;
  };

  return (
    <div className="category-tree-container">
      <Dropdown 
        menu={{ items: menuItems }} 
        trigger={['contextMenu']} 
        open={contextMenuPosition !== null}
        onOpenChange={(open) => {
          if (!open) setContextMenuPosition(null);
        }}
      >
        <div 
          style={{ 
            position: 'relative',
            border: isDraggingProduct ? '2px dashed #1890ff' : '1px solid transparent',
            borderRadius: '4px',
            padding: '8px',
            transition: 'border 0.2s'
          }}
        >
          <Tree
            showLine
            showIcon={false}
            defaultExpandedKeys={expandedKeys}
            expandedKeys={expandedKeys}
            onExpand={onExpand}
            treeData={treeData}
            onSelect={onSelect}
            onRightClick={handleRightClick}
            draggable={!isDraggingProduct}
            titleRender={renderTitle}
            onDrop={info => {
              if (isDraggingProduct) {
                handleProductDrop(info);
              } else {
                onDrop(info);
              }
            }}
            onDragOver={(e) => {
              if (isDraggingProduct) {
                e.preventDefault();
              }
            }}
            className={isDraggingProduct ? 'product-drop-target' : ''}
          />
          {contextMenuPosition && (
            <div
              style={{
                position: 'absolute',
                left: contextMenuPosition.x,
                top: contextMenuPosition.y,
                zIndex: 1000,
              }}
            />
          )}
        </div>
      </Dropdown>
      
      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        title={t('confirm')}
        text={`${t('deleteConfirmation')} ${selectedNode ? getCategoryFullPath(selectedNode.key) : ''}?`}
        confirmLabel={t('yes')}
        rejectLabel={t('no')}
        isVisible={isDeleteModalVisible}
        onConfirm={handleDeleteCategory}
        onCancel={() => setIsDeleteModalVisible(false)}
      />
      
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
      
      {/* Move Products Modal */}
      <Modal
        title={t('moveProductsTitle')}
        open={isMoveProductsModalVisible}
        onCancel={() => setIsMoveProductsModalVisible(false)}
        footer={null}
      >
        <Form
          form={moveProductsForm}
          layout="vertical"
          onFinish={handleMoveProducts}
        >
          <p>
            {selectedNode && t('moveProductsConfirmation').replace('%s', getCategoryFullPath(selectedNode.key))}
          </p>
          <Form.Item
            name="targetCategoryId"
            label={t('targetCategory')}
          >
            <Select
              options={getCategoryOptions(treeData, selectedNode?.key)}
              placeholder={t('selectTarget')}
            />
          </Form.Item>
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsMoveProductsModalVisible(false)}
                style={{ marginRight: 8 }}
              >
                {t('cancel')}
              </button>
              <button type="submit">
                {t('confirm')}
              </button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Merge Category Modal */}
      <Modal
        title={t('mergeCategoryTitle')}
        open={isMergeCategoryModalVisible}
        onCancel={() => setIsMergeCategoryModalVisible(false)}
        footer={null}
      >
        <Form
          form={moveProductsForm}
          layout="vertical"
          onFinish={handleMergeCategory}
        >
          <p>
            {selectedNode && t('mergeCategoryConfirmation').replace('%s', getCategoryFullPath(selectedNode.key))}
          </p>
          <Form.Item
            name="targetCategoryId"
            label={t('targetCategory')}
          >
            <Select
              options={getCategoryOptions(treeData, selectedNode?.key)}
              placeholder={t('selectTarget')}
            />
          </Form.Item>
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsMergeCategoryModalVisible(false)}
                style={{ marginRight: 8 }}
              >
                {t('cancel')}
              </button>
              <button type="submit">
                {t('confirm')}
              </button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Drag and Drop Confirmation Modal */}
      <ConfirmationDialog
        title={t('confirm')}
        text={dragInfo ? 
          `${t('moveConfirmation')} ${dragInfo.dragNode.title} ${t('from')} ${getParentFullPath(dragInfo.dragNode.key) || t('rootCategory')} ${t('to')} ${dragInfo.dropPosition === 0 ? dragInfo.dropNode.title : (getParentFullPath(dragInfo.dropNode.key) || t('rootCategory'))}?` 
          : ''}
        confirmLabel={t('yes')}
        rejectLabel={t('no')}
        isVisible={isDragConfirmModalVisible}
        onConfirm={handleConfirmDragDrop}
        onCancel={() => setIsDragConfirmModalVisible(false)}
      />

      {/* Product Drop Confirmation Modal */}
      <ConfirmationDialog
        title={t('confirm')}
        text={getProductDropConfirmationMessage()}
        confirmLabel={t('yes')}
        rejectLabel={t('no')}
        isVisible={isProductDropModalVisible}
        onConfirm={handleConfirmProductDrop}
        onCancel={handleCancelProductDrop}
      />

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
      
      {/* Move without confirmation checkbox */}
      <div style={{ marginTop: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={moveWithoutConfirmation}
            onChange={(e) => onMoveWithoutConfirmationChange?.(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          {t('moveWithoutConfirmation')}
        </label>
      </div>
    </div>
  );
}
