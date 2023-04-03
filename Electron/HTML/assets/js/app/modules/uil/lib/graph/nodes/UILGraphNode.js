/**
 * UILGraphNode
 * Abstract base class for UILGraphNode.
 * Mostly used for generic events relevant to UILGraphGroup and UILGraphLayer.
 */
Class(function UILGraphNode() {
    Inherit(this, Element);
}, () => {
    UILGraphNode.FOCUSED = 'uilgraphnode_focused';
    UILGraphNode.BLURRED = 'uilgraphnode_blurred';
    UILGraphNode.RENAMED = 'uilgraphnode_renamed';
    UILGraphNode.TOGGLE_VISIBILITY = 'uilgraphnode_toggle_visibility';
});