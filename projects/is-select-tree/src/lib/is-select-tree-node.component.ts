import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TreeComponent, TreeNode } from 'angular-tree-component';
import { Subscription } from 'rxjs';

import { IsSelectField, IsSelectTree, IsSelectTreeChangeEvent, IsSelectTreeNode } from './is-select-tree.models';


@Component({
  selector: 'is-select-tree-node',
  templateUrl: './is-select-tree-node.component.html',
  styleUrls: ['is-select-tree-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
 // encapsulation: ViewEncapsulation.None
})
export class IsSelectTreeNodeComponent implements OnInit, OnDestroy {

  @Input()
  node: TreeNode;

  @Input()
  selection: IsSelectTree;

  private _sub: Subscription;

  constructor(private sanitizer: DomSanitizer, private changeDetector: ChangeDetectorRef) {

  }

  ngOnInit() {
    const node: IsSelectTreeNode = this.node.data;
    this._sub = node.onUpdateView.subscribe(() => {
      this.changeDetector.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this._sub) {
      this._sub.unsubscribe();
    }
  }

  toggleExpandNode() {
    this.node.toggleExpanded();
    this.node.toggleActivated();
    this.changeDetector.detectChanges();
  }

  sanitize(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private findFirstVisibleNonVirutalChild(node: TreeNode): IsSelectTreeNode {
    let found: IsSelectTreeNode = null;
    node.visibleChildren.forEach((n: TreeNode) => {
      if (!found) {
        if (!n.data.isVirtual()) {
          found = n.data;
        } else {
          found = this.findFirstVisibleNonVirutalChild(n);
        }
      }
    });
    return found;
  }

  toggleSelect(event: any, treeNode: TreeNode, field: IsSelectField) {
    event.stopPropagation();
    const node: IsSelectTreeNode = treeNode.data;
    let value: boolean = !node.getValue(field);
    if (node.isVirtual()) {
      // virtual nodes are initially unset, we need to determine based on first child
      const first = this.findFirstVisibleNonVirutalChild(treeNode);
      value = first ? !first.getValue(field) : false;
    }
    if (this.selection.indicateSaving) {
      node.$isSaving = true;
    }

    const change: IsSelectTreeChangeEvent = new IsSelectTreeChangeEvent(() => {
      if (this.selection.indicateSaving) {
        node.$isSaving = false;
      }
      this.selection.updateView();
    });

    this.setValue(treeNode, field, value, node.isPropagateValue, change);
    if (value === true) {
      // set dependent field to true as well
      if (field.dependentFieldName) {
        const dep: IsSelectField = this.selection.selectionFields.find((f: IsSelectField) => f.fieldName === field.dependentFieldName);
        if (!dep) {
          console.warn('unable to find dependent field for', field);
        } else {
          this.setValue(treeNode, dep, value, node.isPropagateValue, change);
        }
      }
    }
    if (value === false) {
      // find field which we depend on and set it's value to false
      const dep: IsSelectField = this.selection.selectionFields.find((f: IsSelectField) => f.dependentFieldName === field.fieldName);
      if (dep) {
        this.setValue(treeNode, dep, value, node.isPropagateValue, change);
      }
    }

    this.selection.changed.emit(change);
  }


  private setValue(treeNode: TreeNode, field: IsSelectField, value: any, deep: boolean, change: IsSelectTreeChangeEvent) {
    const node: IsSelectTreeNode = treeNode.data;
    node.setValue(field, value);
    if (!node.isVirtual()) {
      const c = change.changes[node.id] || {};
      this.selection.selectionFields.forEach((f: IsSelectField) => {
        c[f.fieldName] = node.getValue(f);
      });
      change.changes[node.id] = c;
    }
    this.selection.updateParentClasses(node, field);
    if (deep) {
      treeNode.children.forEach((n: TreeNode) => {
        if (!n.isHidden) {
          this.setValue(n, field, value, true, change);
        }
      });
    }
  }

}
