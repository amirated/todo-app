const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate');
const {
  createGroupSchema,
  updateGroupSchema,
  deleteGroupSchema,
} = require('../schemas/groupSchemas');
const {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} = require('../controllers/groupController');

router.get('/', getGroups);
router.post('/', validate(createGroupSchema), createGroup);
router.put('/:id', validate(updateGroupSchema), updateGroup);
router.delete('/:id', validate(deleteGroupSchema), deleteGroup);

module.exports = router;
