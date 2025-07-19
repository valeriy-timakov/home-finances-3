import React from 'react';
import { Tree } from 'antd';
import 'antd/dist/reset.css';

export default function CategoryTree({ data }: { data: any[] }) {
  // Преобразуем у формат для Ant Tree
  const convert = (nodes: any[]): any[] =>
    nodes.map((n) => ({
      title: n.name,
      key: n.id,
      children: n.children ? convert(n.children) : [],
    }));
  return <Tree treeData={convert(data)} defaultExpandAll />;
}
