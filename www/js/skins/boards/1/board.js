// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Board3D - Creates and manages the 3D chessboard surface including squares,
// border, and rank/file labels. Intended to be owned by ChessRenderer3D.
//

import * as THREE from 'three';

const SQUARE_SIZE = 1;
const BOARD_SIZE = 8;
export const BORDER_SIZE = 8.6;
const LABEL_OFFSET = 4.2;
const RANK_LABEL_OFFSET = 4.15;
const LABEL_PLANE_SIZE = 0.4;
const LABEL_Y = 0.02;

export class Board3D {

    constructor(parentGroup, colors) {
        this.group = new THREE.Group();
        parentGroup.add(this.group);

        this.colors = { light: colors.light, dark: colors.dark };
        this.squareMeshes = [];
        this.squareMap = {};
        this.fileLabelsBottom = [];
        this.fileLabelsTop = [];
        this._labelMeshes = [];
    }

    build() {
        if (this.group.children.length > 0) {
            this._disposeChildren();
        }
        this.squareMeshes = [];
        this.squareMap = {};
        this.fileLabelsBottom = [];
        this.fileLabelsTop = [];
        this._labelMeshes = [];

        this._createSquares();
        this._createBorder();
        this._createLabels();
    }

    _createSquares() {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let f = 0; f < BOARD_SIZE; f++) {
                const isLight = (r + f) % 2 !== 0;
                const color = isLight ? this.colors.light : this.colors.dark;
                const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0 });
                const geo = new THREE.BoxGeometry(SQUARE_SIZE, 0.04, SQUARE_SIZE);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(f - 3.5, 0, -(r - 3.5));
                mesh.receiveShadow = true;
                mesh.userData.square = String.fromCharCode(97 + f) + (r + 1);
                this.group.add(mesh);
                this.squareMeshes.push(mesh);
                this.squareMap[mesh.userData.square] = mesh;
            }
        }
    }

    _createBorder() {
        const bMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.8, metalness: 0 });
        const bGeo = new THREE.BoxGeometry(BORDER_SIZE, 0.12, BORDER_SIZE);
        const border = new THREE.Mesh(bGeo, bMat);
        border.position.set(0, -0.08, 0);
        border.receiveShadow = true;
        this.group.add(border);
    }

    _makeLabelMesh(text) {
        if (typeof document === 'undefined') {
            const geo = new THREE.PlaneGeometry(LABEL_PLANE_SIZE, LABEL_PLANE_SIZE);
            const mat = new THREE.MeshBasicMaterial({ color: 0x95a5a6 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            return mesh;
        }
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#95a5a6';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 68);
        const texture = new THREE.CanvasTexture(canvas);
        const geo = new THREE.PlaneGeometry(LABEL_PLANE_SIZE, LABEL_PLANE_SIZE);
        const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        return mesh;
    }

    _createLabels() {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = [1, 2, 3, 4, 5, 6, 7, 8];

        for (let f = 0; f < 8; f++) {
            const x = f - 3.5;
            const bottom = this._makeLabelMesh(files[f]);
            bottom.position.set(x, LABEL_Y, LABEL_OFFSET);
            this.group.add(bottom);
            this.fileLabelsBottom.push(bottom);
            this._labelMeshes.push(bottom);

            const top = this._makeLabelMesh(files[f]);
            top.position.set(x, LABEL_Y, -LABEL_OFFSET);
            this.group.add(top);
            this.fileLabelsTop.push(top);
            this._labelMeshes.push(top);
        }

        for (let r = 0; r < 8; r++) {
            const z = -(r - 3.5);
            const left = this._makeLabelMesh(ranks[r].toString());
            left.position.set(-RANK_LABEL_OFFSET, LABEL_Y, z);
            this.group.add(left);
            this._labelMeshes.push(left);
            const right = this._makeLabelMesh(ranks[r].toString());
            right.position.set(RANK_LABEL_OFFSET, LABEL_Y, z);
            this.group.add(right);
            this._labelMeshes.push(right);
        }
    }

    setFileLabelsBySide(side) {
        const showBottom = (side === 'white');
        this.fileLabelsBottom.forEach(l => { l.visible = showBottom; });
        this.fileLabelsTop.forEach(l => { l.visible = !showBottom; });
    }

    setColors(light, dark) {
        this.colors = { light, dark };
        this.build();
    }

    highlightSquare(sq, on) {
        const mesh = this.squareMap[sq];
        if (!mesh) return;
        if (on) {
            mesh.material.color.setHex(0xf1c40f);
        } else {
            const f = sq.charCodeAt(0) - 97;
            const r = parseInt(sq[1]) - 1;
            const isLight = (r + f) % 2 !== 0;
            mesh.material.color.setHex(isLight ? this.colors.light : this.colors.dark);
        }
    }

    _disposeChildren() {
        while (this.group.children.length > 0) {
            const child = this.group.children[0];
            child.traverse(node => {
                if (node.isMesh) {
                    node.geometry.dispose();
                    if (Array.isArray(node.material)) {
                        node.material.forEach(m => m.dispose());
                    } else if (node.material) {
                        node.material.dispose();
                    }
                }
            });
            this.group.remove(child);
        }
    }

    dispose() {
        if (this.group.parent) {
            this.group.parent.remove(this.group);
        }
        this._disposeChildren();
    }
}
