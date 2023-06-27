////////////////////////////////////////////////////////////////////////////////
//
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use yew::prelude::*;

use crate::components::expression_panel_sidebar::EditorState;

#[derive(Clone, PartialEq, Properties)]
pub struct AddExpressionButtonProps {
    pub on_open_expr_panel: Callback<Option<String>>,
    pub editor_state: EditorState,
}

/// `onmouseover` is triggered incorrectly on the `DragTarget` of a
/// drag/drop action after `DropEvent` has fired on the `DropTarget`,
/// causing brief hover effects where the mouse _was_ before the action
/// initiated. Various methods of correcting this were attempted, settling
/// on a manual `dragdrop-hover` class toggle, using the `.button()` property
/// to determine the mis-fired event.  This was determined experimentally -
/// according to my read of the spec, this is a bug in Chrome.
///
/// As a result there are 3 hover states `MouseEnter(true)`,
/// `MouseEnter(false)`, and `MouseLeave`;  `MouseEnter(false)` can be
/// replaced, but it causes an extra render of the DOM un-necessarily.
#[function_component]
pub fn AddExpressionButton(p: &AddExpressionButtonProps) -> Html {
    let is_mouseover = yew::use_state_eq(|| false);
    let onmouseover = yew::use_callback(
        |event: MouseEvent, mo| {
            mo.set(event.button() == 0);
        },
        is_mouseover.setter(),
    );

    let onmouseout = yew::use_callback(
        |_event, mo| {
            mo.set(false);
        },
        is_mouseover.setter(),
    );

    let onmousedown = p.on_open_expr_panel.reform(|_| None);
    let class = if *is_mouseover || matches!(p.editor_state, EditorState::NewExpr) {
        classes!("dragdrop-hover")
    } else {
        classes!()
    };

    html! {
        <div
            id="add-expression"
            data-index="-1"
            { class }
            { onmouseover }
            { onmouseout }
            { onmousedown }>

            <span id="add-expression-title">{ "New Column" }</span>
        </div>
    }
}
