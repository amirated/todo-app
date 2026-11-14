const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate');
const {
  createGroupSchema,
  updateGroupSchema,
  deleteGroupSchema,
  reorderGroupsSchema,
} = require('../schemas/groupSchemas');
const {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups,
} = require('../controllers/groupController');

router.get('/', getGroups);
router.post('/', validate(createGroupSchema), createGroup);
// Static paths must stay above '/:id' so they are not treated as ids
router.put('/reorder', validate(reorderGroupsSchema), reorderGroups);
router.put('/:id', validate(updateGroupSchema), updateGroup);
router.delete('/:id', validate(deleteGroupSchema), deleteGroup);

module.exports = router;
