// Get distance between two entities
export function getDistance(entity1, entity2) {
    return entity1.position.distanceTo(entity2.position);
}